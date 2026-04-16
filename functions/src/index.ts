import express from "express";

const app = express();

app.get("/health", (_req, res) => {
	res.status(200).json({
		status: "ok",
		service: "functions",
		provider: "supabase"
	});
});

app.get("/", (_req, res) => {
	res.status(200).send("Functions service is running with Supabase-only integrations.");
});

export {app};
