

// import React, { useCallback, useState } from 'react';
// import { Box, Typography } from '@mui/material';
// import { useTheme } from '@mui/material/styles';
// import { useDropzone } from 'react-dropzone';
// import axios from 'axios';

// interface DropZoneProps {
//   onDrop: (acceptedFiles: File[]) => void;
// }

// const DropZone: React.FC<DropZoneProps> = ({ onDrop }) => {
//   const theme = useTheme();
//   const [output, setOutput] = useState('');

//   const handleDrop = useCallback(async (acceptedFiles: File[]) => {
//     onDrop(acceptedFiles);
//     const formData = new FormData();
//     acceptedFiles.forEach((file) => {
//       console.log('Appending file:', file.name);
//       formData.append('files', file);
//     });

//     try {
      

//       const response = await axios.post('/upload/new_file', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       console.log('Upload successful', response.data);
//       setOutput(response.data.message || 'Files uploaded successfully');
//     } catch (error) {
//       console.error('Error uploading files:', error);
//       setOutput('Error uploading files');
//     }
//   }, [onDrop]);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: handleDrop });

//   return (
//     <Box
//       {...getRootProps()}
//       sx={{
//         border: '2px dashed gray',
//         borderRadius: '4px',
//         padding: '20px',
//         textAlign: 'center',
//         cursor: 'pointer',
//         backgroundColor: isDragActive
//           ? theme.palette.action.hover
//           : theme.palette.background.default,
//         color: theme.palette.text.primary,
//         height: '150px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         mb: 2,
//       }}
//     >
//       <input {...getInputProps()} {...({ webkitdirectory: 'true' } as any)} />
//       {isDragActive ? (
//         <Typography variant="body1">Drop the files here...</Typography>
//       ) : (
//         <Typography variant="body1">
//           Drag 'n' drop parquet files here, or click to select files
//         </Typography>
//       )}
//       <Typography variant="body2" color="textSecondary">
//         {output}
//       </Typography>
//     </Box>
//   );
// };

// export default DropZone;


import React, { useCallback, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useDropzone } from "react-dropzone";
import axios from "axios";

interface DropZoneProps {
  onDrop: (acceptedFiles: File[]) => void;   // callback from parent
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop }) => {
  const theme = useTheme();
  const [output, setOutput] = useState("");

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Let the parent (GraphDataHandler) process the files locally
      onDrop(acceptedFiles);

      // Build multipart-form payload for the backend
      const formData = new FormData();
      acceptedFiles.forEach((file) => formData.append("files", file));

      try {
        /* 1️⃣ upload files */
        const uploadRes = await axios.post("/upload/new_file", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        /* 2️⃣ refresh server-side dataframes */
        const reloadRes = await axios.post("/reload");

        console.log("Upload ➜", uploadRes.data);
        console.log("Reload ➜", reloadRes.data);

        setOutput("Files uploaded and server reloaded");
      } catch (err) {
        console.error("Error:", err);
        setOutput("Error uploading / reloading");
      }
    },
    [onDrop]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { "application/x-parquet": [".parquet"] },
    noKeyboard: true,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed gray",
        borderRadius: 2,
        p: 3,
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: isDragActive
          ? theme.palette.action.hover
          : theme.palette.background.default,
        color: theme.palette.text.primary,
        height: 150,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        mb: 2,
      }}
    >
      <input {...getInputProps()} />
      <Typography variant="body1">
        {isDragActive
          ? "Drop the files here…"
          : "Drag & drop Parquet files here, or click to select"}
      </Typography>
      {output && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          {output}
        </Typography>
      )}
    </Box>
  );
};

export default DropZone;
