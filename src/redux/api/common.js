import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import RNFS from "react-native-fs";
import { Platform } from "react-native";
import { atob, btoa } from "react-native-quick-base64";
// Define the API
export const commonApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: "http://photomedpro.com/api/",
  }),
  tagTypes: [
    "Patient",
    "Banner",
    "PatientDetail",
    "UserProfile",
    "Images",
    "Notification",
  ],
  endpoints: (builder) => ({
    socialLogin: builder.mutation({
      query: ({
        social_id,
        full_name,
        login_type,
        email,
        device_id,
        device_type,
        fcmToken,
      }) => ({
        url: "sociallogin",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          social_id,
          full_name,
          login_type, // e.g., 'google'
          email,
          device_id,
          device_type,
          fcmToken,
        }),
      }),
    }),
    // Fetch a list of patients
    getPatients: builder.query({
      query: ({ token }) => ({
        url: "getpatients",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      providesTags: ["Patient"],
    }),

    // Fetch individual patient details by ID
    getPatientDetails: builder.query({
      query: ({ token, id }) => ({
        url: `getpatietdetails?id=${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      providesTags: (result, error, { id }) => [{ type: "PatientDetail", id }],
    }),

    // Fetch banners
    getBanners: builder.query({
      query: () => ({
        url: "getbanners",
        method: "GET",
      }),
    }),

    // Fetch terms and conditions
    getTermsConditions: builder.query({
      query: ({ token }) => ({
        url: "gettermsconditions",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    }),

    // Add a new patient
    addPatient: builder.mutation({
      query: ({ token, patientData }) => ({
        url: "addpatient",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      }),
      invalidatesTags: ["Patient"],
    }),

    // Delete a patient by ID
    deletePatient: builder.mutation({
      query: ({ token, id }) => ({
        url: "deletepatient",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      }),
      invalidatesTags: ["Patient"],
    }),

    // Update a patient's details
    updatePatient: builder.mutation({
      query: (data) => {
        const formData = new FormData();
        if (data?.updateType == 'count') {
          formData.append("imageCount", data.patientData.imageCount);
        } else if (data?.updateType == 'profile_pic') {

          console.log('datadata update profile_pic', data);
          console.log('datadata update profile_pic', data?.updateType);


          formData.append("profile", {
            uri: data.patientData.data.uri,
            name: data.patientData.data.name || "profile.jpg", // Provide a default name if fileName is unavailable
            type: data.patientData.data.type || "image/jpeg", // Provide a default type if unavailable
          });
        } else {
          formData.append("full_name", data.patientData.full_name);
          formData.append("dob", data.patientData.dob);
          formData.append("mobile", data.patientData.mobile);
          formData.append("email", data.patientData.email);

          // Append profile image if it exists
          if (data.patientData.profile) {
            formData.append("profile", {
              uri: data.patientData.profile.uri,
              name: data.patientData.profile.fileName || "profile.jpg", // Provide a default name if fileName is unavailable
              type: data.patientData.profile.type || "image/jpeg", // Provide a default type if unavailable
            });
          }
        }

        // console.log('frommmmm',formData);

        return {
          url: `updatepatient/${data.id}`,
          method: "PUT",
          headers: {
            Authorization: `Bearer ${data.token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        "Patient",
        { type: "PatientDetail", id },
      ],
    }),

    // Post a query with full_name, email, and query fields
    postQuery: builder.mutation({
      query: ({ token, full_name, email, query }) => ({
        url: "postquery",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ full_name, email, query }),
      }),
    }),
    // Google Drive: Get Folder ID
    getFolderId: builder.query({
      query: ({ folderName, accessToken }) => {
        // console.log('fonder nnnnn', folderName, accessToken);

        const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        // console.log('folder name and token', folderName, accessToken); // Debugging output

        return {
          url: `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            query
          )}&spaces=drive&fields=files(id,name)`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        };
      },
      transformResponse: (response) => {
        // console.log("Response data:", response); // Debug response in RTK Query
        return response.files && response.files.length > 0
          ? response.files[0].id
          : null;
      },
    }),

    // Google Drive: Create Folder
    createFolder: builder.mutation({
      query: ({ folderName, accessToken }) => ({
        url: "https://www.googleapis.com/drive/v3/files",
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        }),
      }),
      transformResponse: (response) => response.id,
    }),

    // Google Drive: Upload File
    uploadFileToDrive: builder.mutation({
      async query({ file, folderId, accessToken }) {
        // console.log('upload file', file);
        // console.log('upload folderId', folderId);
        // console.log('upload access and token', accessToken);

        const { uri, name, type } = file;
        // console.log('urrrrr', uri, name, type);

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
          name,
          parents: [folderId],
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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Failed to upload file: ${data.error.message}`);
        }

        return data;
      },
      transformResponse: (response) => response.id,
    }),

    // Google Drive: List Folder Images
    listFolderImages: builder.query({
      query: ({ folderId, accessToken }) => {
        const query = `parents in '${folderId}' and mimeType contains 'image/' and trashed = false`;
        return {
          url: `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            query
          )}&fields=files(id,name,mimeType,webViewLink,webContentLink)`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        };
      },
      transformResponse: (response) => response.files,
    }),

    // Google Drive: Set File Public
    setFilePublic: builder.mutation({
      query: ({ fileId, accessToken }) => ({
        url: `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }),
    }),

    // Google Drive: Delete File
    deleteImage: builder.mutation({
      query: ({ fileId, accessToken }) => ({
        url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
    }),

    uploadFile: builder.mutation({
      query: ({ file, folderId }) => {
        const boundary = "foo_bar_baz";

        const metadata = {
          name: file.name,
          parents: [folderId],
        };

        const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
          metadata
        )}\r\n`;
        const filePart = `--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n${file.content}\r\n--${boundary}--`;

        return {
          url: "files?uploadType=multipart",
          method: "POST",
          headers: {
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: metadataPart + filePart,
        };
      },
    }),

    /**
     * Upload multiple files to a folder
     */
    uploadFilesToFolder: builder.mutation({
      async queryFn(
        { files, folderName },
        queryApi,
        extraOptions,
        fetchWithBQ
      ) {
        try {
          // Step 1: Get Folder ID or Create if it doesn't exist
          const folderIdResponse = await fetchWithBQ({
            url: `files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&spaces=drive&fields=files(id,name)`,
          });

          let folderId =
            folderIdResponse.data?.files?.[0]?.id ||
            (
              await fetchWithBQ({
                url: "files",
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: {
                  name: folderName,
                  mimeType: "application/vnd.google-apps.folder",
                },
              })
            ).data.id;

          // Step 2: Upload Files
          const uploadPromises = files.map((file) =>
            fetchWithBQ({
              url: "files?uploadType=multipart",
              method: "POST",
              headers: {
                "Content-Type": `multipart/related; boundary=foo_bar_baz`,
              },
              body: createMultipartBody(file, folderId),
            })
          );

          const results = await Promise.all(uploadPromises);
          const fileIds = results.map((res) => res.data.id);

          return { data: fileIds };
        } catch (error) {
          return { error };
        }
      },
    }),
    // Add this to the `endpoints` section of your `commonApi`
    getAllImageUrls: builder.query({
      async queryFn(
        { userId, accessToken },
        queryApi,
        extraOptions,
        baseQuery
      ) {
        const folderPath = `/PhotoMed/${userId}/All Images`;
        // console.log('Token and Path:', userId, accessToken);

        try {
          // Step 1: List files in the folder
          const listFilesResponse = await baseQuery({
            url: "https://api.dropboxapi.com/2/files/list_folder",
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: folderPath }),
          });

          // Check if the first API call was successful
          if (listFilesResponse.error) {
            return {
              error: {
                status: listFilesResponse.error.status,
                data: listFilesResponse.error.data,
              },
            };
          }

          const files = listFilesResponse.data.entries;

          // Filter out folders
          const fileEntries = files.filter((entry) => entry[".tag"] === "file");
          console.log("fileEntriesfileEntries", fileEntries);

          // Step 2: Fetch temporary URLs for each file
          const fileUrls = await Promise.all(
            fileEntries.map(async (file) => {
              try {
                const fileUrlResponse = await baseQuery({
                  url: "https://api.dropboxapi.com/2/files/get_temporary_link",
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ path: file.path_lower }),
                });

                // Check if the API call was successful
                if (fileUrlResponse.error) {
                  console.error(
                    `Failed to fetch URL for ${file.name}:`,
                    fileUrlResponse
                  );
                  console.error(
                    `Failed to fetch URL for ${file.name}:`,
                    fileUrlResponse.error.data
                  );
                  return null; // Skip this file
                }

                return {
                  name: file.name,
                  publicUrl: fileUrlResponse.data.link,
                  client_modified: file.client_modified,
                  server_modified: file.server_modified,
                  size: file.size,
                  id: file.id,
                  path_display: file.path_display,
                };
              } catch (error) {
                console.error(
                  `Error fetching temporary link for file ${file.name}:`,
                  error
                );
                return null; // Skip this file
              }
            })
          );

          // Remove any null entries (files that failed)
          const validFileUrls = fileUrls.filter(Boolean);
          return { data: validFileUrls }; // Return the combined results
        } catch (error) {
          return { error: { status: "FETCH_ERROR", data: error.message } };
        }
      },
      providesTags: (result, error, { userId }) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: "Images", id })),
            { type: "Images", id: "LIST" },
          ]
          : [{ type: "Images", id: "LIST" }],
    }),
    getAllImageUrlsForFilter: builder.mutation({
      async queryFn(
        { userId, accessToken, folderPath },
        queryApi,
        extraOptions,
        baseQuery
      ) {
        // const folderPath = `/PhotoMed/${userId}/All Images`;
        // console.log('Token and Path:', userId, accessToken);

        try {
          // Step 1: List files in the folder
          const listFilesResponse = await baseQuery({
            url: "https://api.dropboxapi.com/2/files/list_folder",
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: folderPath }),
          });

          // Check if the first API call was successful
          if (listFilesResponse.error) {
            return {
              error: {
                status: listFilesResponse.error.status,
                data: listFilesResponse.error.data,
              },
            };
          }

          const files = listFilesResponse.data.entries;

          // Filter out folders
          const fileEntries = files.filter((entry) => entry[".tag"] === "file");
          console.log("fileEntriesfileEntries", fileEntries);

          // Step 2: Fetch temporary URLs for each file
          const fileUrls = await Promise.all(
            fileEntries.map(async (file) => {
              try {
                const fileUrlResponse = await baseQuery({
                  url: "https://api.dropboxapi.com/2/files/get_temporary_link",
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ path: file.path_lower }),
                });

                // Check if the API call was successful
                if (fileUrlResponse.error) {
                  console.error(
                    `Failed to fetch URL for ${file.name}:`,
                    fileUrlResponse
                  );
                  console.error(
                    `Failed to fetch URL for ${file.name}:`,
                    fileUrlResponse.error.data
                  );
                  return null; // Skip this file
                }

                return {
                  name: file.name,
                  publicUrl: fileUrlResponse.data.link,
                  client_modified: file.client_modified,
                  server_modified: file.server_modified,
                  size: file.size,
                  id: file.id,
                  path_display: file.path_display,
                };
              } catch (error) {
                console.error(
                  `Error fetching temporary link for file ${file.name}:`,
                  error
                );
                return null; // Skip this file
              }
            })
          );

          // Remove any null entries (files that failed)
          const validFileUrls = fileUrls.filter(Boolean);
          return { data: validFileUrls }; // Return the combined results
        } catch (error) {
          return { error: { status: "FETCH_ERROR", data: error.message } };
        }
      },
      providesTags: (result, error, { userId }) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: "Images", id })),
            { type: "Images", id: "LIST" },
          ]
          : [{ type: "Images", id: "LIST" }],
    }),
    uploadFileToDropbox: builder.mutation({
      async queryFn(
        { file, userId, accessToken, imageName },
        queryApi,
        extraOptions,
        baseQuery
      ) {
        // console.log('file userId and token', file, userId, accessToken);

        try {
          const { uri, name } = file;
          const path = `/PhotoMed/${userId}/All Images/${imageName || name}`;

          // Check if the path exists
          const pathStatusResponse = await fetch(
            "https://api.dropboxapi.com/2/files/get_metadata",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ path }),
            }
          );

          const pathStatusData = await pathStatusResponse.json();

          if (pathStatusResponse.ok && pathStatusData[".tag"] === "file") {
            throw new Error(
              `A file already exists at ${path}. Cannot upload files here.`
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
          const binaryData = Uint8Array.from(atob(fileData), (c) =>
            c.charCodeAt(0)
          );

          const metadata = {
            path,
            mode: "add",
            autorename: true,
            mute: false,
          };

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
            return { data: responseData };
          } else {
            return { error: rawResponse || "Failed to upload file" };
          }
        } catch (error) {
          return { error: error.message || "An unknown error occurred" };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "Images", id: "LIST" },
      ],
    }),

    uploadSingleFileToDropbox: builder.mutation({
      async queryFn({ file, userId, accessToken },) {
        try {
          let { uri, name } = file;

          console.log("uri-----", uri);
          // if (!uri.startsWith('file://')) {
          //   uri = `file://${uri}`;
          // }
          const path = `/PhotoMed/${userId}/All Images/${name}`;
          const fileData = await fetch(uri);
          const blob = await fileData.blob();
          const metadata = {
            path,
            mode: "add",
            autorename: true,
            mute: false,
          };
          const response = await fetch(
            "https://content.dropboxapi.com/2/files/upload",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/octet-stream",
                "Dropbox-API-Arg": JSON.stringify(metadata),
              },
              body: blob,
            }
          );

          const rawResponse = await response.text();
          if (response.ok) {
            const responseData = JSON.parse(rawResponse);
            return { data: responseData };
          } else {
            return { error: rawResponse || "Failed to upload file" };
          }
        } catch (error) {
          return { error: error.message || "An unknown error occurred" };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "Images", id: "LIST" },
      ],
    }),

    deleteFileFromDropbox: builder.mutation({
      query: ({ filePath, accessToken }) => {
        // Log the file path and access token
        // console.log('File Path:', filePath);
        // console.log('Access Token:', accessToken);

        return {
          url: "https://api.dropboxapi.com/2/files/delete_v2",
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: {
            path: filePath, // Path to the file you want to delete
          },
        };
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: "Images", id: "LIST" },
      ],
    }),
    postImageCategory: builder.mutation({
      query: ({ token, imageData }) => ({
        url: "imagecategory",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: imageData,
      }),
    }),
    getImageCategory: builder.query({
      query: ({ token, id }) => ({
        url: `getimagecategory/${id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token if needed
          "Content-Type": "application/json",
        },
      }),
    }),
    getImageCategories: builder.query({
      query: ({ token }) => ({
        url: `getimagecategory`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token if needed
          "Content-Type": "application/json",
        },
      }),
    }),
    getNotifications: builder.query({
      query: ({ token }) => ({
        url: "getnotifications",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
      providesTags: (result) =>
        result?.ResponseBody?.notifications
          ? [
            ...result.ResponseBody.notifications.map(({ _id }) => ({
              type: "Notification",
              id: _id,
            })),
            { type: "Notification", id: "LIST" },
          ]
          : [{ type: "Notification", id: "LIST" }],
    }),
    deleteNotification: builder.mutation({
      query: ({ notificationIds, token }) => ({
        url: `deletenotification`, // Update this to match your API endpoint
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: { notificationIds }, // Sending the array in the request body
      }),
      invalidatesTags: (result, error, { notificationIds }) => [
        { type: "Notification", id: "LIST" }, // Invalidate the entire list tag
        ...notificationIds.map((id) => ({ type: "Notification", id })), // Invalidate each specific notification
      ],
    }),
    shareUrl: builder.mutation({
      query: ({ body, token }) => ({
        url: "shareurl", // Full URL including API path
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      // Adding a custom `transformRequest` hook to log the body and token
      transformRequest: (request) => {
        // console.log('Request Body:', request.body); // Log body
        // console.log('Request Token:', request.headers.Authorization.split(' ')[1]); // Log token (splitting to get the actual token)
        return request;
      },
    }),
    postDrCategorySubcat: builder.mutation({
      query: ({ token, catData }) => ({
        url: "adddrcategory",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: catData,
      }),
    }),
    getMixedCategories: builder.query({
      query: ({ token }) => ({
        url: "getdrcategory",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    }),
    getUserProfile: builder.query({
      query: ({ token }) => ({
        url: 'getprofile',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    }),
    deleteTagSubTag: builder.mutation({

      query: ({ token, id }) => ({
        url: `deletedrcategory/${id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }),
    }),

    // postPatientTags: builder.mutation({
    //   query: ({ token, tags, patientId }) => ({
    //     url: `addtags/${patientId}`,
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: tags,
    //   }),
    // }),

    postAttachImageWithTag: builder.mutation({
      query: ({ token, tag, subtag, imageId }) => ({
        url: `imagecategory`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "imageId": imageId,
          "tag": tag,
          "subtag": subtag
        }),
      }),
    }),
    getAttachImageWithTag: builder.query({
      query: ({ token, imageId }) => {
        console.log('getAttachImageWithTag', token, imageId);
        return {
          url: `imagecategory/${imageId}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      }
    }),

  }),
});

export const {
  useGetPatientsQuery,
  useGetPatientDetailsQuery,
  useGetBannersQuery,
  useGetTermsConditionsQuery,
  useAddPatientMutation,
  useDeletePatientMutation,
  useUpdatePatientMutation,
  usePostQueryMutation,
  usePostImageCategoryMutation,
  useSocialLoginMutation,
  useGetFolderIdQuery,
  useCreateFolderMutation,
  useUploadFileToDriveMutation,
  useListFolderImagesQuery,
  useSetFilePublicMutation,
  useDeleteImageMutation,
  useGetAllImageUrlsQuery,
  useGetAllImageUrlsForFilterMutation,
  useUploadFileToDropboxMutation,
  useUploadSingleFileToDropboxMutation,
  useDeleteFileFromDropboxMutation,
  useUploadFilesToFolderMutation,
  useGetImageCategoryQuery,
  useGetImageCategoriesQuery,
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
  useShareUrlMutation,
  usePostDrCategorySubcatMutation,
  useGetMixedCategoriesQuery,
  useGetUserProfileQuery,
  useDeleteTagSubTagMutation,
  // usePostPatientTagsMutation
  usePostAttachImageWithTagMutation,
  useLazyGetAttachImageWithTagQuery,
} = commonApi;
