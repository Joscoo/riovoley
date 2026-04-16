const express = require("express");

const app = express();

app.get("/health", (_req, res) => {
	res.status(200).json({
		status: "ok",
		service: "riovoley",
		provider: "supabase"
	});
});

app.get("/", (_req, res) => {
	res.status(200).send("Service running with Supabase-only integrations.");
});

module.exports = app;
