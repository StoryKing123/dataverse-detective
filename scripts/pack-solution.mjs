import { spawnSync } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"

const workspaceRoot = process.cwd()

const distDir = path.join(workspaceRoot, "dist")
const solutionSrcDir = path.join(workspaceRoot, "solution", "src")
const solutionOutDir = path.join(workspaceRoot, "solution", "out")

const webResourcesRootDir = path.join(solutionSrcDir, "WebResources")

const webResourceTargetDir = path.join(
	solutionSrcDir,
	"WebResources",
	"util_",
	"dataverse_detective",
)

const stagingDir = path.join(solutionOutDir, "_pack_tmp")
const outZip = path.join(solutionOutDir, "dataverse_detective_unmanaged.zip")

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true })
}

async function exists(filePath) {
	try {
		await fs.access(filePath)
		return true
	} catch {
		return false
	}
}

async function listFilesRecursive(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true })
	const files = []
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			files.push(...(await listFilesRecursive(fullPath)))
		} else if (entry.isFile()) {
			files.push(fullPath)
		}
	}
	return files
}

function contentTypesXml(defaultExtensions) {
	const defaults = [...defaultExtensions].sort()
	const nodes = defaults
		.map((ext) => {
			const contentType = ext === "xml" ? "text/xml" : "application/octet-stream"
			return `<Default Extension="${ext}" ContentType="${contentType}" />`
		})
		.join("")
	return `<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${nodes}</Types>`
}

async function main() {
	if (!(await exists(distDir))) {
		throw new Error(`Missing dist output: ${distDir}. Run "pnpm build" first.`)
	}

	await fs.rm(webResourcesRootDir, { recursive: true, force: true })
	await ensureDir(webResourceTargetDir)
	const distEntries = await fs.readdir(distDir, { withFileTypes: true })
	for (const entry of distEntries) {
		if (!entry.isFile()) continue
		const srcFile = path.join(distDir, entry.name)
		const destFile = path.join(webResourceTargetDir, entry.name)
		await fs.copyFile(srcFile, destFile)
	}

	await ensureDir(solutionOutDir)
	await fs.rm(stagingDir, { recursive: true, force: true })
	await ensureDir(stagingDir)

	await fs.copyFile(
		path.join(solutionSrcDir, "Other", "Customizations.xml"),
		path.join(stagingDir, "customizations.xml"),
	)
	await fs.copyFile(
		path.join(solutionSrcDir, "Other", "Solution.xml"),
		path.join(stagingDir, "solution.xml"),
	)

	await fs.cp(
		path.join(solutionSrcDir, "WebResources"),
		path.join(stagingDir, "WebResources"),
		{ recursive: true },
	)

	const webResourceFiles = await listFilesRecursive(
		path.join(stagingDir, "WebResources"),
	)
	const extensions = new Set(["xml"])
	for (const file of webResourceFiles) {
		const ext = path.extname(file).slice(1).toLowerCase()
		if (ext) extensions.add(ext)
	}
	await fs.writeFile(
		path.join(stagingDir, "[Content_Types].xml"),
		contentTypesXml(extensions),
		"utf8",
	)

	await fs.rm(outZip, { force: true })
	const zipResult = spawnSync("zip", ["-r", "-q", "-X", outZip, "."], {
		cwd: stagingDir,
		stdio: "inherit",
	})
	if (zipResult.status !== 0) {
		throw new Error(`zip failed with exit code ${zipResult.status ?? "unknown"}`)
	}

	await fs.rm(stagingDir, { recursive: true, force: true })

	console.log(outZip)
}

main().catch((error) => {
	console.error(error?.message ?? error)
	process.exit(1)
})
