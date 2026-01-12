import RNFS from "react-native-fs";
import { Alert, Platform } from "react-native";
import Toast from "react-native-simple-toast";
import { navigate } from "../navigators/NavigationService";
import ScreenName from "./screenName";
import { getData, storeData } from "./helperFunction";
import { store } from "../redux/store";
import { logout, setAccessToken, } from "../redux/slices/authSlice";
// import { atob } from "react-native-quick-base64";
import base64 from 'react-native-base64';
const { dispatch } = store;
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Image as ImageResizer } from "react-native-compressor";
import axios from 'axios';
import { setUserSubscription } from "../redux/slices/patientSlice";
import { BASEURL, DROPBOX_CLIENT_ID, DROPBOX_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_STORE_SECRET } from "@env"
import Config from 'react-native-config';

export const configUrl = {
  imageUrl: "https://photomedpro.com:10049/",
  // imageUrl: "http://10.34.185.152:10049/",
  BASE_URL: BASEURL || Config.BASEURL,
  defaultUser: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
  DROPBOX_CLIENT_ID: DROPBOX_CLIENT_ID || Config.DROPBOX_CLIENT_ID,
  DROPBOX_CLIENT_SECRET: DROPBOX_CLIENT_SECRET || Config.DROPBOX_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID || Config.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET || Config.GOOGLE_CLIENT_SECRET,
  APP_STORE_SECRET: APP_STORE_SECRET || Config.APP_STORE_SECRET
};

const GOOGLE_BASE_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
console.log('BASEURL',BASEURL);

export async function getFolderId(
  folderName,
  accessToken,
  parentFolderId = null
) {
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  // If a parent folder ID is provided, include it in the query
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }
  try {

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&spaces=drive&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  } catch (error) {
    console.log('error---69', error);
  }
}


export async function createFolder(folderName, accessToken) {
  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const data = await response.json();
  return data.id;
}



export async function uploadFileToDrive(
  file,
  folderId,
  accessToken,
  nameImage = ""
) {
  const { uri, name, type } = file;
  const actualPath =
    Platform.OS === "android" && uri.startsWith("content://")
      ? `${RNFS.TemporaryDirectoryPath}/${name}`
      : uri;

  if (Platform.OS === "android" && uri.startsWith("content://")) {
    await RNFS.copyFile(uri, actualPath);
  }

  const fileData = await RNFS.readFile(actualPath, "base64");
  const boundary = "foo_bar_baz";

  const metadata = {
    name: nameImage || name,
    parents: [folderId],
    properties: {
      uploadDate: new Date().toISOString(), // Custom property for date and time
    },
  };

  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;
  const filePart = `--${boundary}\r\nContent-Type: ${type}\r\nContent-Transfer-Encoding: base64\r\n\r\n${fileData}\r\n--${boundary}--`;

  const multipartRequestBody = metadataPart + filePart;

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  const responseData = await response.json();
  if (response.ok) {
    return responseData.id;
  } else {
    Toast.show(responseData.error.message);
    throw new Error(responseData.error.message || "Failed to upload file");
  }
}

export async function createFolderInParent(folderName, parentId, accessToken) {
  try {
    const response = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId], // Ensure parentId is correctly set
      }),
    });

    const data = await response.json();
    // Check for errors in the API response
    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create folder");
    }

    return data.id;
  } catch (error) {
    throw error;
  }
}

export async function createFolderInParentAndCheck(folderName, parentId, accessToken) {
  try {
    // Step 1: Check if folder already exists
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      // ✅ Folder already exists
      return searchData.files[0].id;
    }

    // Step 2: Create new folder if not found
    const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      throw new Error(createData.error?.message || "Failed to create folder");
    }

    return createData.id;
  } catch (error) {
    console.error("createFolderInParent error:", error);
    throw error;
  }
}


// Helper function to find a subfolder inside a parent folder
export async function getSubFolderId(
  subFolderName,
  parentFolderId,
  accessToken
) {
  const query = `name='${subFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parentFolderId}' in parents`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&spaces=drive&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

// export async function checkGooleAllImagesFolderExists(folderId, accessToken) {
//   const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`;

//   try {
//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     });

//     if (response.ok) {
//       const data = await response.json();
//       return true; // Folder exists
//     } else {
//       const errorData = await response.json();
//       return false; // Folder doesn't exist
//     }
//   } catch (error) {
//     console.error("Error checking folder existence:", error.message);
//     return false;
//   }
// }

export const safeCreateFolder = async (
  folderPath,
  accessToken,
  parentId = "root"
) => {
  try {
    if (!accessToken) throw new Error("Access token is missing");

    const driveEndpoint = "https://www.googleapis.com/drive/v3/files";
    const folderNames = folderPath.split("/"); // Split folder path into hierarchy
    let currentParentId = parentId;

    for (let i = 0; i < folderNames.length; i++) {
      const folderName = folderNames[i];
      if (!folderName) continue; // Skip if folderName is empty

      try {
        // Check if the folder exists in the current parent folder
        const checkRes = await fetch(
          `${driveEndpoint}?q='${currentParentId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!checkRes.ok) {
          throw new Error(
            `Failed to fetch folder "${folderName}". Status: ${checkRes.status}`
          );
        }

        const checkData = await checkRes.json();
        if (
          checkData.files &&
          checkData.files.length > 0 &&
          checkData.files[0].id
        ) {
          // Folder exists, continue to the next level
          currentParentId = checkData.files[0].id;
        } else {
          // Folder doesn't exist, create it at this level
          const createRes = await fetch(`${driveEndpoint}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: folderName,
              mimeType: "application/vnd.google-apps.folder",
              parents: [currentParentId],
            }),
          });

          if (!createRes.ok) {
            throw new Error(
              `Failed to create folder "${folderName}". Status: ${createRes.status}`
            );
          }

          const createData = await createRes.json();
          currentParentId = createData.id;
        }
      } catch (error) {
        console.error(
          `Error processing folder "${folderName}":`,
          error.message
        );
        throw error; // Optionally rethrow the error to propagate it
      }
    }

    return currentParentId;
  } catch (error) {
    console.error(
      `Error checking or creating folder "${folderPath}":`,
      error.message
    );
    return null; // Return null to indicate failure without crashing the app
  }
};

export async function uploadCaptureFilesToPhotoMedFolder(
  filePathArray,
  patientInfo,
  accessToken
) {
  try {
    if (!filePathArray || !filePathArray.length) {
      throw new Error("No files to upload");
    }
    const patientFolderName = patientInfo.patientName + patientInfo.patientId;
    let allImagesFolderId = await safeCreateFolder(
      `Photomed/${patientFolderName}/All Images`,
      accessToken,
      "root"
    );

    if (!allImagesFolderId) {
      throw new Error("Failed to upload file");
    }

    const uploadPromises = filePathArray.map(async (file, index) => {
      return uploadFileToDrive(
        file,
        allImagesFolderId,
        accessToken,
        file.name
      );
    });

    const fileIds = await Promise.all(uploadPromises);
    return fileIds;
  } catch (error) {
    // console.error('Failed to upload files:', error);
    throw error;
  }
}

export async function uploadFilesToPhotoMedFolder(
  filePathArray,
  patientInfo,
  accessToken
) {
  try {
    if (!filePathArray || !filePathArray.length) {
      throw new Error("No files to upload");
    }

    const patientFolderName = patientInfo.patientName + patientInfo.patientId;
    let allImagesFolderId = await safeCreateFolder(
      `Photomed/${patientFolderName}/All Images`,
      accessToken,
      "root"
    );
    if (!allImagesFolderId) {
      throw new Error("Failed to upload file");
    }
    const uploadedImages = await listFolderImages(
      allImagesFolderId,
      accessToken
    );
    let totalPImg = uploadedImages && uploadedImages.length > 0 ? uploadedImages.length : 0;

    // Step 4: Upload images to the "All Images" folder
    const uploadPromises = filePathArray.map(async (file, index) => {
      let imgUri = await ImageResizer.compress(file.uri, {
        compressionMethod: "auto",
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.65,
      });

      file.uri = imgUri;

      let uniqueKey = generateUniqueKey();
      return uploadFileToDrive(
        file,
        allImagesFolderId,
        accessToken,
        `${patientInfo.patientName}_${uniqueKey}.jpg`
      );
    });
    const fileIds = await Promise.all(uploadPromises);
    return fileIds;
  } catch (error) {
    // console.error('Failed to upload files:', error);
    throw error;
  }
}



export const getImageDetailsById = async (fileId, accessToken) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webContentLink,description,properties,createdTime`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching image details:", error);
    throw error;
  }
};

export async function listFolderImages(folderId, accessToken) {
  const query = `parents in '${folderId}' and mimeType contains 'image/' and trashed = false`;
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,mimeType,webViewLink,webContentLink,description,properties,createdTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    // console.error('Error listing files:', data);
    throw new Error(data.error.message || "Failed to list files");
  }

  return data.files;
}



export async function fetchFolder(folderId, accessToken) {
  try {
    if (!folderId || !accessToken) {
      throw new Error("Missing folderId or accessToken");
    }

    const query = `'${folderId}' in parents and trashed=false`;
    const res = await axios.get(DRIVE_API, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: query,
        fields:
          'files(id,name,mimeType,webViewLink,webContentLink,description,properties,createdTime)',
      },
    });

    if (!res.data || !Array.isArray(res.data.files)) {
      throw new Error("Invalid response structure from Google Drive API");
    }

    return res.data;
  } catch (error) {
    console.log('fetchFolder', JSON.stringify(error, null, 2));
    const message = "Something went wrong.";
    throw new Error(`Drive API Error : ${message}`);
  }
}

export async function setFilePublic(fileId, accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    // console.error('Error setting file public:', data);
    throw new Error(data.error.message || "Failed to set file public");
  }

  return data;
}

export const getAllImagesRecursively = async (accessToken, folderId) => {
  try {
    if (!accessToken) {
      throw new Error("Access token is missing");
    }
    if (!folderId) {
      throw new Error("Folder ID is missing");
    }

    let allFiles = [];

    const dermoData = await fetchFolder(folderId, accessToken);

    if (!dermoData || !Array.isArray(dermoData.files)) {
      throw new Error("Invalid response from fetchFolder");
    }

    for (const file of dermoData.files) {
      console.log('filefile---', file);

      try {
        let obj = {};

        if (file.mimeType === "application/vnd.google-apps.folder") {
          obj.folderId = file.id;
          obj.folderName = file.name;
          const arr = [];

          const folderItem = await fetchFolder(file.id, accessToken);

          if (folderItem?.files?.length) {
            for (const element of folderItem.files) {
              try {
                await setFilePublic(element.id, accessToken);
                const modifiedObj = {
                  path: element.webContentLink,
                  ...element
                };
                arr.push(modifiedObj);
              } catch (innerErr) {
                console.error(
                  `Failed to set file public for ${element.id}:`,
                  innerErr.message
                );
              }
            }
          }

          obj.images = arr;
          allFiles.push(obj);
        }
        else if (file.mimeType?.startsWith("image/")) {
          await setFilePublic(file.id, accessToken);
          obj.folderName = "root";
          obj.folderId = folderId;
          obj.images = [{ ...file, path: file.webContentLink }];
          allFiles.push(obj);
        }
      } catch (fileErr) {
        console.error(`Error processing file ${file.id || file.name}:`, fileErr);
      }
    }

    return allFiles;
  } catch (err) {
    console.error("Error in getAllImagesRecursively:", err);
    throw new Error(
      `Failed to get images recursively: ${err.message || "Unknown error"}`
    );
  }
};

export async function deleteImage(fileId, accessToken) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error.message || "Failed to delete file");
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function deleteDriveFolder(folderId, accessToken) {
  try {
    // 1. Fetch all children inside folder
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const listData = await listResponse.json();

    if (!listResponse.ok) {
      throw new Error(listData.error?.message || "Failed to list folder files");
    }

    // 2. Delete all child files one by one
    for (const item of listData.files) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    // 3. Delete the folder itself
    const deleteFolderResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteFolderResponse.ok) {
      const errorData = await deleteFolderResponse.json();
      throw new Error(errorData.error?.message || "Failed to delete folder");
    }

    return true;
  } catch (error) {
    console.log("Delete folder error:", error);
    return false;
  }
}



async function checkIfPathExists(path, accessToken) {
  try {
    const url = "https://api.dropboxapi.com/2/files/get_metadata";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path }),
    });

    const data = await response.json();
    if (data[".tag"] === "file") {
      return "file";
    } else if (data[".tag"] === "folder") {
      return "folder";
    } else {
      return null;
    }
  } catch (error) {
    if (error.error && error.error[".tag"] === "path") {
      // Path doesn't exist
      return null;
    }
    throw error;
  }
}

function base64ToBinary(base64) {


  const binaryString =  base64.decode(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function ensureDropboxFolderExists(folderPath, accessToken) {
  const url = "https://api.dropboxapi.com/2/files/create_folder_v2";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: folderPath }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return true;
    } else if (responseData.error?.path?.[".tag"] === "conflict") {
      return true;
    } else {
      throw new Error(responseData.error_summary || "Failed to create folder");
    }
  } catch (error) {
    throw error;
  }
}


export async function uploadFileToDropbox(
  file,
  accessToken,
  userId,
  properties
) {
  const { uri, name } = file;
  const path = `/PhotoMed/${userId}/All Images/${name}`;

  const pathStatus = await checkIfPathExists(
    `/PhotoMed/${userId}/All Images`,
    accessToken
  );

  if (pathStatus === "file") {
    throw new Error(
      `A file already exists at /PhotoMed/${userId}. Cannot upload files here.`
    );
  }

  const actualPath =
    Platform.OS === "android" && uri.startsWith("content://")
      ? `${RNFS.TemporaryDirectoryPath}/${name}`
      : uri;

  if (Platform.OS === "android" && uri.startsWith("content://")) {
    await RNFS.copyFile(uri, actualPath);
  }

  const fileData = await RNFS.readFile(actualPath, "base64");
  const binaryData = base64ToBinary(fileData);

  const metadata = {
    path,
    mode: "add",
    autorename: true,
    mute: false,
  };

  try {
    const response = await fetch(
      "https://content.dropboxapi.com/2/files/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify(metadata),
        },
        body: binaryData,
      }
    );

    const rawResponse = await response.text();

    if (response.ok) {
      const responseData = JSON.parse(rawResponse);
      return responseData;
    } else {
      console.error("Error uploading file:", rawResponse);
      throw new Error(rawResponse || "Failed to upload file");
    }
  } catch (error) {
    console.error("Error in uploadFileToDropbox:", error);
    throw error;
  }
}

export async function getDropboxFileUrl(filePath, accessToken) {
  try {
    const url = "https://api.dropboxapi.com/2/files/get_temporary_link";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${String(accessToken)}`, // Ensure accessToken is a string
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: filePath }),
    });

    const responseData = await response.json();
    if (response.ok) {
      return responseData.link; // Return the temporary link
    } else {
      console.error("Error fetching Dropbox temporary link:", responseData);
      throw new Error(
        responseData.error_summary || "Failed to fetch temporary link"
      );
    }
  } catch (error) {
    console.error("Error in getDropboxFileUrl:", error);
    throw error;
  }
}

export async function listDropboxFilesInFolder(folderPath, accessToken) {
  try {
    const url = "https://api.dropboxapi.com/2/files/list_folder";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${String(accessToken)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path: folderPath }),
    });


    const responseData = await response.json();
    if (response.ok) {
      return responseData.entries; // Return file entries (metadata)
    } else if (
      responseData.error?.[".tag"] === "path" &&
      responseData.error.path?.[".tag"] === "not_found"
    ) {
      console.warn(`Folder not found: ${folderPath}. Creating folder.`);
      await ensureDropboxFolderExists(folderPath, accessToken); // Ensure the folder exists
      return []; // Return an empty array as no files exist yet
    } else {
      console.error("Error listing files in folder:", responseData);
      throw new Error(responseData.error_summary || "Failed to list folder");
    }
  } catch (error) {
    console.error("Error in listDropboxFilesInFolder:", error);
    throw error;
  }
}

export async function getAllImageUrls(userId, accessToken) {
  const folderPath = `/PhotoMed/${userId}`;
  try {
    const files = await listDropboxFilesInFolder(folderPath, accessToken);
    const fileUrls = await Promise.all(
      files.map(async (file) => {
        const publicUrl = await getDropboxFileUrl(file.path_lower, accessToken);
        return {
          name: file.name,
          publicUrl,
          client_modified: file.client_modified,
          server_modified: file.server_modified,
          size: file.size,
          id: file.id,
          path_display: file.path_display,
        };
      })
    );

    return fileUrls;
  } catch (error) {
    console.error("Error fetching image URLs:", error);
    throw error;
  }
}

export async function deleteFileFromDropbox(filePath, accessToken) {
  try {
    const url = "https://api.dropboxapi.com/2/files/delete_v2";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: filePath, // Path to the file you want to delete
      }),
    });

    const responseData = await response.json();
    if (response.ok) {
      return responseData;
    } else {
      console.error("Error deleting file:", responseData);
      throw new Error(responseData.error_summary || "Failed to delete file");
    }
  } catch (error) {
    console.error("Error in deleteFileFromDropbox:", error);
    throw error;
  }
}

export async function copyFileToCategoryFolder(
  fileId,
  categoryFolderId,
  accessToken,
  categoryName,
  copy_image_name
) {
  const copyUrl = `${GOOGLE_BASE_URL}/files/${fileId}/copy`;
  const fileMetadata = {
    name: `${copy_image_name}`,
    parents: [categoryFolderId],
    description: fileId,
    appProperties: {
      parentFileId: fileId, // Ensure you set the appProperties here
      categoryName: categoryName,
    },
  };

  try {
    const copyResponse = await fetch(copyUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fileMetadata),
    });
    const copyResult = await copyResponse.json();
    return copyResult;
  } catch (error) {
    return null;
  }
}

async function getFileProperties(fileId, accessToken) {
  const fileUrl = `${GOOGLE_BASE_URL}/files/${fileId}?fields=appProperties`;
  const response = await fetch(fileUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  const fileData = await response.json();
  return fileData.appProperties;
}

// export async function createCategoryImage(
//   accessToken,
//   parentFolderId,
//   fileId,
//   categoryName
// ) {
//   try {
//     // Ensure we create or get the patient-specific folder instead of the category folder
//     const categoryFolderId = await createOrGetCategoryFolder(
//       parentFolderId,
//       categoryName,
//       accessToken
//     );

//     // Check if the image exists in the patient folder (not in the category folder)
//     const imageExists = await checkIfFileExistsInFolder(
//       fileId,
//       categoryFolderId,
//       accessToken
//     );

//     if (imageExists) {
//       Toast.show("Image already exists in the patient folder.");
//     } else {
//       // Copy the file into the patient-specific folder
//       const resp = await copyFileToCategoryFolder(
//         fileId,
//         categoryFolderId,
//         accessToken
//       );
//       navigate(ScreenName.HOME);
//     }
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// Check if the file already exists in the category folder

export async function checkIfFileExistsInFolder(
  parentFileId,
  categoryFolderId,
  accessToken
) {
  const searchUrl = `${GOOGLE_BASE_URL}/files?q='${categoryFolderId}' in parents and trashed=false&fields=files(id,name,appProperties)`;

  const searchResponse = await fetch(searchUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const searchResult = await searchResponse.json();

  if (searchResult.files && searchResult.files.length > 0) {
    for (const file of searchResult.files) {
      if (!file.appProperties) {
        const fileProperties = await getFileProperties(file.id, accessToken);
      }
      if (file.appProperties?.parentFileId === parentFileId) {
        return true;
      }
    }
  }

  return false;
}

export async function createOrGetCategoryFolder(
  parentFolderId,
  categoryName,
  accessToken
) {
  // Check for existing folder
  const searchUrl = `${GOOGLE_BASE_URL}/files?q=name='${categoryName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,appProperties)`;

  try {
    const searchResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const searchResult = await searchResponse.json();
    // Check if the folder exists
    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    // Create new folder if not found
    const createFolderUrl = `${GOOGLE_BASE_URL}/files`;
    const folderMetadata = {
      name: categoryName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };

    const createResponse = await fetch(createFolderUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(folderMetadata),
    });
    const createResult = await createResponse.json();
    return createResult.id;
  } catch (error) {
    return null;
  }
}


export const generateUniqueKey = () => {
  return uuidv4().replace(/\D/g, "").slice(0, 5);
};

export async function copyImageToCategoryWithCheck({
  imageDetails,
  categoryName,
  accessToken,
  patientId,
  image_name,
  subCat,
  cat,
  patientName,
}) {
  const { filePath } = imageDetails; // Extract filePath and image name

  try {
    const destinationFolder = `/PhotoMed/${patientId}/${categoryName}/${subCat.trim()}`; // Destination folder
    await ensureDropboxFolderExists(destinationFolder, accessToken);
    const filesInFolder = await listDropboxFilesInFolder(
      destinationFolder,
      accessToken
    );

    let imagesCount =
      filesInFolder && filesInFolder.length > 0 ? filesInFolder.length : 0;
    let uniqueKey = generateUniqueKey();
    let image_new_name = `${patientName.trim()}_${cat}_${subCat}_${uniqueKey}_${imagesCount + 1
      }.jpeg`;

    const destinationPath = `${destinationFolder}/${image_new_name}`; // Full path including the file name

    // Check if the file already exists
    const fileExists = filesInFolder.some(
      (file) => file.name === image_new_name
    );
    if (fileExists) {
      return destinationPath;
    }

    // // Copy the file if it doesn't exist
    const response = await fetch("https://api.dropboxapi.com/2/files/copy_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_path: filePath, // Original file path
        to_path: destinationPath, // New category path
        autorename: false, // Avoid renaming to ensure uniqueness
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return responseData.metadata.path_display; // Return the new file path
    } else {
      console.error("Error copying image to category:", responseData);
      throw new Error(responseData.error_summary || "Failed to copy image");
    }
  } catch (error) {
    console.error("Error in copyImageToCategoryWithCheck:", error);
    throw error;
  }
}

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  const tokenUrl = "https://api.dropboxapi.com/oauth2/token";
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    client_id: configUrl.DROPBOX_CLIENT_ID,
    client_secret: configUrl.DROPBOX_CLIENT_SECRET,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    if (response.ok) {
      const { access_token, expires_in } = data;
      return {
        access_token,
        expires_in,
      };
    } else {
      console.error("Refresh token error:", data);
      throw new Error(data.error_description || "Failed to refresh token");
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
};

export const ensureValidAccessToken = async (accessToken) => {
  try {
    // Retrieve tokens and expiry
    const tokenExpiry = await getData("token_expiry");
    const refreshToken = await getData("refresh_token"); // Assuming you store it
    // Check if the token has expired or is missing
    if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry) {
      if (!refreshToken) {
        throw new Error("No refresh token available to refresh access token.");
      }

      // Refresh the token
      const { access_token, expires_in } = await refreshAccessToken(
        refreshToken
      );
      const expiryTime = Date.now() + expires_in * 1000;
      dispatch(setAccessToken(access_token));
      await storeData("token_expiry", expiryTime);
      return access_token; // Return the new token
    }

    return accessToken; // Return the existing valid token
  } catch (error) {
    console.error("Error ensuring valid access token:", error);
    throw error;
  }
};

export const checkAndRefreshGoogleAccessToken = async (accessToken) => {
  const refreshToken = await getData("refresh_token"); // Retrieve the stored refresh token
  const tokenExpiryTime = await getData("token_expiry"); // Retrieve token expiry time
  try {
    if (!tokenExpiryTime || !accessToken || Date.now() >= tokenExpiryTime) {
      const { access_token, expires_in } = await refreshGoogleDriveAccessToken(
        refreshToken
      );
      const expiryTime = Date.now() + expires_in * 1000;
      dispatch(setAccessToken(access_token));
      await storeData("token_expiry", expiryTime);
      return access_token;
    } else {
      return accessToken; // Return the existing token
    }
  } catch (error) {
    throw new Error("Token Not Genrated");
  }
};

async function refreshGoogleDriveAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  const tokenUrl = "https://oauth2.googleapis.com/token";
  const params = new URLSearchParams({
    client_id: configUrl.GOOGLE_CLIENT_ID,
    client_secret: configUrl.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();
    if (response.ok) {
      const { access_token, expires_in } = data;
      return {
        access_token,
        expires_in,
      };
    } else {
      console.error("refreshGoogleDriveAccessToken: error", data);
      Alert.alert(
        "Session Expired",
        "Your session has expired. Please log in again.",
        [
          {
            text: "OK",
            onPress: async () => {
              dispatch(logout());
            },
          },
        ]
      );
      throw new Error(data.error_description || "Failed to refresh token");
    }
  } catch (error) {
    console.error("refreshGoogleDriveAccessToken rerror:", error);
    throw error;
  }
}

export async function copyImageToAllImagesFolder({
  imageDetails,
  accessToken,
  patientId,
}) {
  const { filePath, name } = imageDetails; // Extract filePath and image name

  const destinationFolder = `/PhotoMed/${patientId}/All Images`; // Destination folder
  const destinationPath = `${destinationFolder}/${name}`; // Full path including the file name

  try {
    // Ensure the destination folder exists
    await ensureDropboxFolderExists(destinationFolder, accessToken);

    // Force copy the file, overwriting if it exists
    const response = await fetch("https://api.dropboxapi.com/2/files/copy_v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_path: filePath, // Original file path
        to_path: destinationPath, // New destination path
        autorename: true, // Set to true to create a new copy if file exists
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return responseData.metadata.path_display; // Return the new file path
    } else {
      console.error("Error copying image to All Images folder:", responseData);
      throw new Error(responseData.error_summary || "Failed to copy image");
    }
  } catch (error) {
    console.error("Error in copyImageToAllImagesFolder:", error);
    throw error;
  }
}


// Helper to fetch Google Drive API
async function fetchGoogleDriveAPI(endpoint, method, accessToken, body = null) {
  const response = await fetch(`${GOOGLE_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : null,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(
      responseData.error.message || "Google Drive API call failed"
    );
  }

  return responseData;
}

// Function to ensure folder exists
async function ensureGoogleDriveFolderExists(
  folderName,
  parentFolderId,
  accessToken
) {

  const query = `'${parentFolderId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const response = await fetchGoogleDriveAPI(
    `/files?q=${encodeURIComponent(query)}`,
    "GET",
    accessToken
  );

  if (response.files && response.files.length > 0) {
    return response.files[0].id; // Return folder ID if it exists
  }

  // Create the folder if it doesn't exist
  const newFolder = await fetchGoogleDriveAPI("/files", "POST", accessToken, {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentFolderId],
  });

  return newFolder.id; // Return newly created folder ID
}

// Function to copy file to the folder
async function copyGoogleDriveFile(fileId, destinationFolderId, accessToken) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parents: [destinationFolderId],
        properties: {
          uploadDate: new Date().toISOString(), // Custom property for date and time
        },
      }),
    }
  );

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error.message || "Failed to copy file");
  }

  return responseData.id; // Return new file ID
}

// Main function to handle the file copy
export async function copyImageToGoogleDriveAllImagesFolder({
  imageDetails,
  accessToken,
  patientId,
}) {
  const { fileId, name } = imageDetails;

  try {
    // Root PhotoMed folder
    const photoMedFolderId = await ensureGoogleDriveFolderExists(
      "PhotoMed",
      "root",
      accessToken
    );

    // Patient folder
    const patientFolderId = await ensureGoogleDriveFolderExists(
      `${patientId}`,
      photoMedFolderId,
      accessToken
    );

    // All Images folder
    const allImagesFolderId = await ensureGoogleDriveFolderExists(
      "All Images",
      patientFolderId,
      accessToken
    );

    // Copy the file to the All Images folder
    const newFileId = await copyGoogleDriveFile(
      fileId,
      allImagesFolderId,
      accessToken
    );

    return newFileId; // Return the new file ID
  } catch (error) {
    console.error("Error in copyImageToGoogleDriveAllImagesFolder:", error);
    throw error;
  }
}



export async function getUserPlans(token, isLast = true) {
  let url = !isLast ? `${configUrl.BASE_URL}subscriptions` : `${configUrl.BASE_URL}subscriptions?latest=true`
  console.log('plan response--', token);
  console.log('plan response--', url);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });



  const data = await response.json();

  return data;
}

export async function addSubscriptions(token, data1) {
  let url = `${configUrl.BASE_URL}subscriptions`
  try {

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data1),
    });
    const data = await response.json();
    return data;

  } catch (error) {
    console.log('addSubscriptionsaddSubscriptions error', error);

  }
}

export const validateSubscription = async (token) => {
  console.log("configUrl.BASE_URL + 'validate-receipt'", configUrl.BASE_URL + 'validate-receipt');
  console.log("configUrl.BASE_URL + token", token);

  try {
    const response = await fetch(configUrl.BASE_URL + 'validate-receipt', {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.log('validateSubscription error', error);
    return error
  }
}

export const validateSubscription1 = async (token, receipt, platform = Platform.OS) => {
  console.log('platformplatform', platform);
  console.log('tokentoken', token);

  try {
    const response = await fetch(configUrl.BASE_URL + 'validate-receipt1', {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ // ✅ Correct key here
        platform,
        receiptData: receipt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text(); // helpful for debugging backend response
      throw new Error(`Response status: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.log('validateSubscription error', error);
    return error;
  }
};

// export const validateReceiptData = async (receipt, platform = Platform.OS) => {
//   const validProductIds = Platform.select({
//     ios: ['quarterlysubscription_20', 'yearly_subscription_photomed', 'monthly_plan_photomed'],
//     android: ['com.photomedPro.com'],
//   });

//   try {
//     let validation = null;

//     if (platform === 'ios') {
//       let response = await axios.post('https://buy.itunes.apple.com/verifyReceipt', {
//         'receipt-data': receipt,
//         'password': configUrl.APP_STORE_SECRET,
//         'exclude-old-transactions': true,
//       });

//       if (response.data.status === 21007) {
//         response = await axios.post('https://sandbox.itunes.apple.com/verifyReceipt', {
//           'receipt-data': receipt,
//           'password': configUrl.APP_STORE_SECRET,
//           'exclude-old-transactions': true,
//         });
//       }

//       const { status, latest_receipt_info, pending_renewal_info } = response.data;
//       console.log('===response===', response.data);

//       if (status !== 0) {
//         console.warn('Apple receipt validation failed:', response.data);
//         return null;
//       }

//       const activeSub = latest_receipt_info
//         .filter((r) => validProductIds.includes(r.product_id))
//         .sort((a, b) => b.purchase_date_ms - a.purchase_date_ms)[0];

//       if (activeSub) {
//         const expiresDateMs = parseInt(activeSub.expires_date_ms, 10);
//         const isExpired = Date.now() > expiresDateMs ? 'yes' : 'no';;
//         const renewalInfo = pending_renewal_info?.find(
//           (info) => info.product_id === activeSub.product_id
//         );
//         const isCanceled = renewalInfo?.auto_renew_status === '0' ? 'yes' : 'no';;

//         validation = {
//           platform: 'ios',
//           productId: activeSub.product_id,
//           transactionId: activeSub.original_transaction_id,
//           isExpired,
//           isCanceled,
//           expirationDate: new Date(expiresDateMs).toISOString(),
//           expirationDateMs: expiresDateMs,
//         };
//       }
//     } else {
//       const receiptData = JSON.parse(receipt);
//       const { purchaseToken, productId, packageName } = receiptData;

//       const purchase = await androidPublisher.purchases.subscriptions.get({
//         packageName,
//         subscriptionId: productId,
//         token: purchaseToken,
//       });

//       const sub = purchase.data;
//       const expiresDateMs = parseInt(sub.expiryTimeMillis, 10);
//       const isExpired = Date.now() > expiresDateMs ? 'yes' : 'no';
//       const isCanceled = (sub.autoRenewing === false && !isExpired) ? 'yes' : 'no';;

//       validation = {
//         platform: 'android',
//         productId,
//         isExpired,
//         isCanceled,
//         expirationDate: new Date(expiresDateMs).toISOString(),
//         expirationDateMs: expiresDateMs,
//       };
//     }

//     return validation;
//   } catch (err) {
//     console.error('❌ Receipt validation failed:', err?.response?.data || err.message);
//     return null;
//   }
// };

// export const getUserSubscription = async (token) => {
//   try {
//     getUserPlans(token).then(async (userSub) => {
//       if (userSub?.ResponseBody) {
//         let validRecipt = await validateReceiptData(userSub?.ResponseBody?.receiptData, userSub?.ResponseBody?.receiptData?.platform);
//         console.log('validReciptvalidRecipt', validRecipt);
//         if (validRecipt) {
//           dispatch(setUserSubscription(validRecipt));
//         }
//       }
//       // console.log('getUserPlans success ---', userSub);
//     }).catch((error) => {
//       console.log('getUserPlans error---', error);
//     })

//   } catch (error) {

//   }

// }


// api/subscription.js
export const getMySubscriptionDetails = async (token, userId) => {
 
  if (!token) {
    console.error("Authentication token missing. Please log in again.");
    return null;
  }

  try {
    const response = await fetch(
      "https://photomedpro.com:10049/api/check-user-subscription",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // body: JSON.stringify({ userId }),
      }
    );

    const responseData = await response.json();

    if (response.ok && responseData?.transactionId) {
      console.log("✅ Subscription details:", responseData);
      return responseData;
    } else {
      console.error("❌ Failed to fetch subscription details:", responseData);
      return null;
    }
  } catch (error) {
    console.error("⚠️ Error fetching subscription details:", error);
    return null;
  }
};


export const getAppStatus = async () => {
  try {
    const response = await fetch(configUrl.BASE_URL + 'app-status', {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text(); // helpful for debugging backend response
      throw new { error: 'error' }
    }
    return await response.json();
  } catch (error) {
    console.log('validateSubscription error', error);
    return { error: 'error' };
  }
};