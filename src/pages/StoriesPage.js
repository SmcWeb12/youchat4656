import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase/firebase";  // Ensure `storage` is exported from your Firebase config
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore"; // Add doc and updateDoc
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // No change needed here
import { arrayUnion } from "firebase/firestore"; // Import arrayUnion

const StatusPage = ({ userId }) => {
  const [statuses, setStatuses] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Fetch statuses from Firestore
    const unsubscribe = onSnapshot(collection(db, "statuses"), (snapshot) => {
      const statusesArray = snapshot.docs.map((doc) => doc.data());
      setStatuses(statusesArray);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);

    const statusId = Date.now();
    const storageRef = ref(storage, `statuses/${userId}/${statusId}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docRef = doc(db, "statuses", "global");
      await updateDoc(docRef, {
        status: arrayUnion({
          id: statusId,
          userId,
          image: downloadURL,
          timestamp: new Date().toISOString(),
        }),
      });

      alert("Status uploaded successfully!");
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Status</h2>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => handleUpload(e.target.files[0])}
        disabled={uploading}
        className="mb-4"
      />
      {uploading && <p>Uploading...</p>}
      <div className="grid grid-cols-3 gap-4">
        {statuses.map((status, index) => (
          <img key={index} src={status.image} alt="status" className="w-24 h-24 rounded-full" />
        ))}
      </div>
    </div>
  );
};

export default StatusPage;
