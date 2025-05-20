import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Entity }            from "../models/entity";
import { Relationship }      from "../models/relationship";
import { Document }          from "../models/document";
import { TextUnit }          from "../models/text-unit";
import { Community }         from "../models/community";
import { CommunityReport }   from "../models/community-report";
import { Covariate }         from "../models/covariate";
import { readParquetFile }   from "../utils/parquet-utils";

/* ─────────────── static maps ─────────────── */
const baseFileNames = [
  "entities.parquet",
  "relationships.parquet",
  "documents.parquet",
  "text_units.parquet",
  "communities.parquet",
  "community_reports.parquet",
  "covariates.parquet",
];

const baseMapping: Record<string, string> = {
  "entities.parquet":           "entity",
  "relationships.parquet":      "relationship",
  "documents.parquet":          "document",
  "text_units.parquet":         "text_unit",
  "communities.parquet":        "community",
  "community_reports.parquet":  "community_report",
  "covariates.parquet":         "covariate",
};

const fileSchemas: Record<string, string> = {};
Object.entries(baseMapping).forEach(([k, v]) => {
  fileSchemas[k]                 = v;
  fileSchemas[`create_final_${k}`] = v;
});

/* ─────────────── hook ─────────────── */
const useFileHandler = () => {
  const navigate = useNavigate();

  /* ——— React state for every table ——— */
  const [entities,         setEntities]         = useState<Entity[]>([]);
  const [relationships,    setRelationships]    = useState<Relationship[]>([]);
  const [documents,        setDocuments]        = useState<Document[]>([]);
  const [textunits,        setTextUnits]        = useState<TextUnit[]>([]);
  const [communities,      setCommunities]      = useState<Community[]>([]);
  const [covariates,       setCovariates]       = useState<Covariate[]>([]);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);

  /* ——— DRAG-AND-DROP / DEFAULT LOADING ——— */
  const handleFilesRead = useCallback(async (files: File[]) => {
    await loadFiles(files);
  }, []);

  const loadFiles = useCallback(async (files: Array<File | string>) => {
    const ents:   Entity[][]           = [];
    const rels:   Relationship[][]     = [];
    const docs:   Document[][]         = [];
    const txts:   TextUnit[][]         = [];
    const comms:  Community[][]        = [];
    const reports:CommunityReport[][]  = [];
    const covs:   Covariate[][]        = [];

    for (const f of files) {
      const fileName = typeof f === "string" ? f.split("/").pop()! : f.name;
      const schema   = fileSchemas[fileName];

      let data;
      if (typeof f === "string") {
        const resp = await fetch(f);
        if (!resp.ok) { console.error("Fetch failed for", f); continue; }
        const buf  = await resp.arrayBuffer();
        data = await readParquetFile(
          new File([buf], fileName, { type: "application/x-parquet" }),
          schema
        );
      } else {
        data = await readParquetFile(f, schema);
      }

      switch (schema) {
        case "entity":           ents.push(data);      break;
        case "relationship":     rels.push(data);      break;
        case "document":         docs.push(data);      break;
        case "text_unit":        txts.push(data);      break;
        case "community":        comms.push(data);     break;
        case "community_report": reports.push(data);   break;
        case "covariate":        covs.push(data);      break;
        default: break;
      }
    }

    setEntities(ents.flat());
    setRelationships(rels.flat());
    setDocuments(docs.flat());
    setTextUnits(txts.flat());
    setCommunities(comms.flat());
    setCommunityReports(reports.flat());
    setCovariates(covs.flat());
  }, []);

  /* ——— check if a default file exists ——— */
  const checkFileExists = async (url: string) => {
    try {
      const r = await fetch(url, { method: "HEAD", cache: "no-store" });
      return r.ok && r.headers.get("Content-Type") === "application/octet-stream";
    } catch {
      return false;
    }
  };

  /* ——— dev helper to auto-load from /public/artifacts ——— */
  const loadDefaultFiles = useCallback(async () => {
    const list: string[] = [];

    for (const b of baseFileNames) {
      const pref = `${process.env.PUBLIC_URL}/artifacts/create_final_${b}`;
      const plain = `${process.env.PUBLIC_URL}/artifacts/${b}`;

      if      (await checkFileExists(pref))  list.push(pref);
      else if (await checkFileExists(plain)) list.push(plain);
    }

    if (list.length) {
      await loadFiles(list);
      navigate("/graph", { replace: true });
    } else {
      console.log("No default parquet files found.");
    }
  }, [loadFiles, navigate]);

  /* 🆕 ——— clear everything when /clear/output succeeds ——— */
  const resetAllTables = useCallback(() => {
    setEntities([]);
    setRelationships([]);
    setDocuments([]);
    setTextUnits([]);
    setCommunities([]);
    setCommunityReports([]);
    setCovariates([]);
  }, []);

  /* ——— expose API ——— */
  return {
    entities,
    relationships,
    documents,
    textunits,
    communities,
    covariates,
    communityReports,
    handleFilesRead,
    loadDefaultFiles,
    resetAllTables,          // 🆕 exported
  };
};

export default useFileHandler;
