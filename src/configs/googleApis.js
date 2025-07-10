export async function apiRequest(url, options) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }
      return data;
    } catch (error) {
      console.error('API request error:', error.message);
      throw error;
    }
  }
  

export async function getFolderId(folderName, accessToken, parentFolderId = null) {
    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
    // If a parent folder ID is provided, include it in the query
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
  
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  }
  

export async function createFolder(folderName, accessToken) {
const response = await fetch('https://www.googleapis.com/drive/v3/files', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  }),
});
const data = await response.json();
return data.id;
}

export async function getOrCreateFolder(folderName, accessToken, parentFolderId = null) {
    let folderId = await getFolderId(folderName, accessToken, parentFolderId);
    if (!folderId) {
      folderId = await createFolder(folderName, accessToken, parentFolderId);
      // console.log(`Created folder "${folderName}" with ID: ${folderId}`);
    } else {
      // console.log(`Folder "${folderName}" exists with ID: ${folderId}`);
    }
    return folderId;
  }
  