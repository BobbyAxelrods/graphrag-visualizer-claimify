import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import axios from "axios";

/* ─── theme (optional) ─── */
const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
  typography: { fontFamily: "Roboto, sans-serif" },
});

/* ─── props ─── */
interface IntroductionProps {
  onGraphCleared: () => void; // comes from GraphDataHandler
}

/* ─── component ─── */
const Introduction: React.FC<IntroductionProps> = ({ onGraphCleared }) => {
  const [statusMsg, setStatusMsg] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  /* handlers --------------------------------------------------- */
  const handleCheckSettings = async () => {
    try {
      const { data } = await axios.get("/check/settings");
      setStatusMsg(data.status);
    } catch (err) {
      console.error(err);
      setStatusMsg("⚠️ Error checking settings");
    }
  };

  const clearOutput = async () => {
    try {
      const { data } = await axios.post("/clear/output");
      setStatusMsg(data.status);
      setFiles([]);
      onGraphCleared();               // 🔄 remains
    } catch (err) {
      console.error(err);
      setStatusMsg("⚠️ Error clearing output");
    }
  };

  const checkOutputFolder = async () => {
    try {
      const { data } = await axios.get("/check/output");
      if (typeof data.files === "string") {
        setStatusMsg(data.files);     // message like “No output directory…”
        setFiles([]);
      } else {
        setFiles(data.files);
        setStatusMsg(
          data.files.length ? "📂 Output folder contents:" : "Output folder is empty",
        );
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("⚠️ Error checking output folder");
    }
  };

  /* render ------------------------------------------------------ */
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleCheckSettings}>
            Check Settings
          </Button>
          <Button variant="contained" color="secondary" onClick={clearOutput}>
            Clear Output
          </Button>
          <Button variant="outlined" onClick={checkOutputFolder}>
            Check Output Folder
          </Button>
        </Box>

        {statusMsg && (
          <Chip label={statusMsg} color="primary" variant="outlined" sx={{ mt: 2 }} />
        )}

        {files.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 2, maxWidth: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f}>
                    <TableCell>{f}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Introduction;
