import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { setPatientImages } from "../../redux/slices/patientSlice";
import {  setAccessToken } from "../../redux/slices/authSlice";
import { getData, storeData } from "../helperFunction";
import { checkAndRefreshGoogleAccessToken, getFolderId, refreshGoogleDriveAccessToken, setFilePublic } from "../api";
export const useGoogleDriveImages = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const listFolderImages = useCallback(async (folderId, accessToken) => {
    const query = `parents in '${folderId}' and mimeType contains 'image/' and trashed = false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,webContentLink,description,properties,createdTime)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Failed to list files");
    return data.files || [];
  }, []);

  const fetchGoogleDriveImages = useCallback(async (accessToken, patientName, trimmedId, saveCount) => {
    
    try {
      setLoading(true);
      const validToken = await checkAndRefreshGoogleAccessToken(accessToken);

      console.log('validTokenvalidToken',validToken);
      
      // Step 1: PhotoMed folder
      const photoMedFolderId = await getFolderId("PhotoMed", accessToken);
      console.log('photoMedFolderId',photoMedFolderId);
      
      if (!photoMedFolderId) throw new Error("PhotoMed folder not found");

      // Step 2: Patient folder
      const patientFolderId = await getFolderId(`${patientName}${trimmedId}`, validToken, photoMedFolderId);
      if (!patientFolderId) {
        saveCount(null);
        throw new Error("Patient folder not found");
      }

      // Step 3: All Images folder
      const allImagesFolderId = await getFolderId("All Images", validToken, patientFolderId);
      if (!allImagesFolderId) throw new Error("All Images folder not found");

      await storeData("patientFolderId", allImagesFolderId);

      // Step 4: Fetch images
      const uploadedImages = await listFolderImages(allImagesFolderId, validToken);

      const publicImages = await Promise.all(
        uploadedImages.map(async (img) => ({
          ...img,
          publicUrl: await setFilePublic(img.id, validToken),
        }))
      );

      dispatch(setPatientImages(publicImages));
      saveCount(publicImages.length || null);

    } catch (error) {
      console.error("Error fetching Google Drive images:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchGoogleDriveImages, loading };
};
