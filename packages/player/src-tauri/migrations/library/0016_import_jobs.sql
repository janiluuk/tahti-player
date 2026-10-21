-- An import in progress. Every path is listed when the job starts and ticked
-- off in the same transaction that saves its batch (1 = imported, 2 = failed),
-- so an import interrupted by a quit or a cancel continues with the files it
-- had not reached, without re-reading finished ones. A job is deleted once
-- nothing is left pending; removing a root drops its unfinished job.
CREATE TABLE library_import_jobs (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL DEFAULT '',
    root_id TEXT REFERENCES library_roots(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_import_job_paths (
    job_id TEXT NOT NULL REFERENCES library_import_jobs(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (job_id, path)
);
