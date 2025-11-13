const getAllImagesRecursively = async (accessToken, folderId) => {
  let allFiles = [];

  const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

  async function fetchFolder(folderId) {
    const query = `'${folderId}' in parents and trashed=false`;
    const res = await axios.get(DRIVE_API, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: query,
        fields: 'files(id,name,mimeType,webViewLink,webContentLink,description,properties,createdTime)',
      },
    });
    return res.data
  }

  const dermoData = await fetchFolder(folderId);
  for (const file of dermoData.files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      const folterItem = await fetchFolder(file.id);
      console.log('folterItemfolterItem',);
      
    } else if (file.mimeType.startsWith('image/')) {
      allFiles.push(file);
    }
  }
  //  let folders = [];
  //   let files = [];
  //   let mainData = [];

  //   if (res?.data?.files && res.data.files?.length > 0) {
  //     files = res?.data?.files.filter(item => item.mimeType !== "application/vnd.google-apps.folder");
  //     folders = res?.data?.files.filter(item => item.mimeType === "application/vnd.google-apps.folder");
  //   }

  // const publicLinkRootFolder = await setFilePublic(files[0].id,accessToken);
  // for (const file of res.data.files) {
  //   if (file.mimeType === 'application/vnd.google-apps.folder') {

  //   } else if (file.mimeType.startsWith('image/')) {
  //     // Only images (jpeg, png, etc.)
  //     files.push(file);
  //   }
  // }



  // console.log("📁 folders:-----", JSON.stringify(folders, null, 2));
  // console.log("📁 files-----:", JSON.stringify(files, null, 2));

  // console.log("📁 Folders:", folders);
  // console.log("🖼️ Files:", files);
  // for (const file of res.data.files) {
  //   if (file.mimeType === 'application/vnd.google-apps.folder') {
  //     // Recursive call for subfolders
  //     await fetchFolder(file.id);
  //   } else if (file.mimeType.startsWith('image/')) {
  //     // Only images (jpeg, png, etc.)
  //     allFiles.push(file);
  //   }
  // }


  // await fetchFolder(folderId);
  // return allFiles;
};