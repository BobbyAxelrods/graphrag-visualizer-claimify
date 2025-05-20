import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import ReactGA from "react-ga4";

import GraphViewer from "./GraphViewer";
import DropZone from "./DropZone";
import Introduction from "./Introduction";
import DataTableContainer from "./DataTableContainer";

import useFileHandler from "../hooks/useFileHandler";
import useGraphData from "../hooks/useGraphData";

/* ─────────────────────────────────────────────────────────── */

const GraphDataHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* UI state */
  const [tabIndex, setTabIndex] = useState(0);
  const [graphType, setGraphType] = useState<"2d" | "3d">("2d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [selectedTable, setSelectedTable] = useState<
    | "entities"
    | "relationships"
    | "documents"
    | "textunits"
    | "communities"
    | "communityReports"
    | "covariates"
  >("entities");
  const [includeDocuments, setIncludeDocuments] = useState(false);
  const [includeTextUnits, setIncludeTextUnits] = useState(false);
  const [includeCommunities, setIncludeCommunities] = useState(false);
  const [includeCovariates, setIncludeCovariates] = useState(false);
  const [graphVersion, setGraphVersion] = useState(0);

  /* Data hooks */
  const {
    entities,
    relationships,
    documents,
    textunits,
    communities,
    covariates,
    communityReports,
    handleFilesRead,
    loadDefaultFiles,
    resetAllTables,              // NEW ❕ (add this helper inside your hook)
  } = useFileHandler();

  const graphData = useGraphData(
    entities,
    relationships,
    documents,
    textunits,
    communities,
    communityReports,
    covariates,
    includeDocuments,
    includeTextUnits,
    includeCommunities,
    includeCovariates,
  );
  const hasGraph = graphData.nodes?.length > 0;

  /* Handy flags */
  const hasDocuments   = documents.length   > 0;
  const hasTextUnits   = textunits.length   > 0;
  const hasCommunities = communities.length > 0;
  const hasCovariates  = covariates.length  > 0;

  /* ─── effects ─── */

  /* 1 • load defaults in dev */
  useEffect(() => {
    if (process.env.NODE_ENV === "development") loadDefaultFiles();
  }, [loadDefaultFiles]);

  /* 2 • init Google Analytics */
  useEffect(() => {
    const id = process.env.REACT_APP_GA_MEASUREMENT_ID;
    id ? ReactGA.initialize(id) : console.error("GA measurement ID not found");
  }, []);

  /* 3 • sync tab index with URL path */
  useEffect(() => {
    switch (location.pathname) {
      case "/upload": setTabIndex(0); break;
      case "/graph":  setTabIndex(1); break;
      case "/data":   setTabIndex(2); break;
      default:        setTabIndex(0);
    }
  }, [location.pathname]);

  /* ─── callbacks ─── */

  /** Fired by <DropZone/> – builds tables then jumps to /graph */
  const onDrop = useCallback(
    (files: File[]) => {
      handleFilesRead(files);
      navigate("/graph", { replace: true });
    },
    [handleFilesRead, navigate],
  );

  /** Called after the user clicks “Clear Output” in <Introduction/> */
  // const clearLocalTables = () => resetAllTables();   // comes from your hook
  
  const clearLocalTables = () => {  
    resetAllTables();
    setGraphKey((v) => v + 1);
    navigate("/graph", { replace: true });
  };

  const handleTabChange = (_: React.ChangeEvent<{}>, idx: number) => {
    setTabIndex(idx);
    navigate(idx === 1 ? "/graph" : idx === 2 ? "/data" : "/upload");

    ReactGA.send({
      hitType: "event",
      eventCategory: "Tabs",
      eventAction: "click",
      eventLabel: `Tab ${idx}`,
    });
  };

  const toggleGraphType  = () => setGraphType((t) => (t === "2d" ? "3d" : "2d"));
  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  /* ─── render ─── */

  return (
    <>
      <Tabs value={tabIndex} onChange={handleTabChange} centered>
        <Tab label="Upload Artifacts" />
        <Tab label="Graph Visualization" />
        <Tab label="Data Tables" />
      </Tabs>

      {tabIndex === 0 && (
        <Container maxWidth="md" sx={{ mt: 3, display: "flex", flexDirection: "column" }}>
          <DropZone onDrop={onDrop} />
          <Introduction onGraphCleared={clearLocalTables} /> {/* pass helper */}
        </Container>
      )}

      {tabIndex === 1 && (
        <Box
          p={3}
          sx={{
            height: isFullscreen ? "100vh" : "calc(100vh - 64px)",
            width:  isFullscreen ? "100vw" : "100%",
            position: isFullscreen ? "fixed" : "relative",
            top: 0, left: 0, zIndex: isFullscreen ? 1300 : "auto",
            overflow: "hidden",
          }}
        >
          {hasGraph ? (<GraphViewer
            key={graphVersion}
            data={graphData}
            graphType={graphType}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onToggleGraphType={toggleGraphType}
            includeDocuments={includeDocuments}
            includeTextUnits={includeTextUnits}
            includeCommunities={includeCommunities}
            includeCovariates={includeCovariates}
            hasDocuments={hasDocuments}
            hasTextUnits={hasTextUnits}
            hasCommunities={hasCommunities}
            hasCovariates={hasCovariates}
            onIncludeDocumentsChange={() => setIncludeDocuments(!includeDocuments)}
            onIncludeTextUnitsChange={() => setIncludeTextUnits(!includeTextUnits)}
            onIncludeCommunitiesChange={() => setIncludeCommunities(!includeCommunities)}
            onIncludeCovariatesChange={() => setIncludeCovariates(!includeCovariates)}
          />
        ) : (
            <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
              No data loaded – upload Parquet artifacts first.
            </Typography>
          )}
        </Box>
      )}

      {tabIndex === 2 && (
        <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
          <DataTableContainer
            selectedTable={selectedTable}
            setSelectedTable={setSelectedTable}
            entities={entities}
            relationships={relationships}
            documents={documents}
            textunits={textunits}
            communities={communities}
            communityReports={communityReports}
            covariates={covariates}
          />
        </Box>
      )}
    </>
  );
};

export default GraphDataHandler;
