import type { ApiEndpoint, EndpointParam } from "@/lib/types";

/** A ready-to-render code snippet for one language/tool. */
export interface CodeSample {
  label: string;
  language: string;
  code: string;
}

type SampleValue = string | number | boolean;
type SampleBody = Record<string, SampleValue>;

type HttpMethod = ApiEndpoint["method"];

const BODY_METHODS: ReadonlyArray<HttpMethod> = ["POST", "PUT", "PATCH"];

/** Pick a realistic demo value for a parameter based on its name and type. */
function sampleValue(param: EndpointParam): SampleValue {
  const name = param.name.toLowerCase();
  const type = param.type.toLowerCase();

  if (name.includes("length")) return 16;

  if (["number", "integer", "int", "float"].includes(type)) {
    if (name.includes("page")) return 1;
    return 10;
  }
  if (["boolean", "bool"].includes(type)) return true;

  if (name.includes("url") || name.includes("link")) return "https://example.com";
  if (name.includes("email")) return "user@example.com";
  if (name.includes("username")) return "topinz";
  if (name.includes("algorithm")) return "sha256";
  if (name === "mode") return "upper";
  if (
    name.includes("text") ||
    name.includes("message") ||
    name.includes("query") ||
    name.includes("prompt") ||
    name === "q"
  ) {
    return "Halo dunia";
  }
  return "contoh";
}

/** Prefer the documented example request; otherwise build a demo query string. */
function buildRequestPath(endpoint: ApiEndpoint): string {
  const example = endpoint.exampleRequest;
  if (example && example.startsWith("/")) return example;

  const query = endpoint.params
    .filter((param) => param.in === "query")
    .map(
      (param) =>
        `${encodeURIComponent(param.name)}=${encodeURIComponent(
          String(sampleValue(param))
        )}`
    )
    .join("&");

  return query ? `${endpoint.path}?${query}` : endpoint.path;
}

/** Demo JSON body for POST/PUT/PATCH endpoints, or null when not applicable. */
function buildBody(endpoint: ApiEndpoint): SampleBody | null {
  if (!BODY_METHODS.includes(endpoint.method)) return null;
  const bodyParams = endpoint.params.filter((param) => param.in === "body");
  if (bodyParams.length === 0) return null;

  const body: SampleBody = {};
  for (const param of bodyParams) {
    body[param.name] = sampleValue(param);
  }
  return body;
}

/** Indent every line after the first (for embedding pretty JSON inside code). */
function indentTail(text: string, indent: string): string {
  return text
    .split("\n")
    .map((line, index) => (index === 0 ? line : indent + line))
    .join("\n");
}

function phpValue(value: SampleValue): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function phpArray(body: SampleBody, baseIndent: string): string {
  const entries = Object.entries(body).map(
    ([key, value]) => `${baseIndent}  ${JSON.stringify(key)} => ${phpValue(value)}`
  );
  return `[\n${entries.join(",\n")}\n${baseIndent}]`;
}

function pyValue(value: SampleValue): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

function pyDict(body: SampleBody): string {
  const entries = Object.entries(body).map(
    ([key, value]) => `    ${JSON.stringify(key)}: ${pyValue(value)}`
  );
  return `{\n${entries.join(",\n")}\n}`;
}

function curlSample(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body: SampleBody | null
): string {
  const lines = [`curl -X ${method} "${url}" \\`];
  if (body) {
    lines.push(`  -H "apikey: ${apiKey}" \\`);
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(body)}'`);
  } else {
    lines.push(`  -H "apikey: ${apiKey}"`);
  }
  return lines.join("\n");
}

function axiosSample(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body: SampleBody | null
): string {
  const fn = method.toLowerCase();
  const tail = `  .then((res) => console.log(res.data))
  .catch((err) => console.error(err.response?.data ?? err.message));`;

  if (BODY_METHODS.includes(method)) {
    const dataArg = body ? "body" : "null";
    const bodyDecl = body
      ? `\nconst body = ${JSON.stringify(body, null, 2)};\n`
      : "";
    return `const axios = require("axios");
${bodyDecl}
axios
  .${fn}(${JSON.stringify(url)}, ${dataArg}, {
    headers: { apikey: ${JSON.stringify(apiKey)} }
  })
${tail}`;
  }

  return `const axios = require("axios");

axios
  .${fn}(${JSON.stringify(url)}, {
    headers: { apikey: ${JSON.stringify(apiKey)} }
  })
${tail}`;
}

function fetchSample(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body: SampleBody | null
): string {
  if (body) {
    return `const res = await fetch(${JSON.stringify(url)}, {
  method: ${JSON.stringify(method)},
  headers: {
    apikey: ${JSON.stringify(apiKey)},
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${indentTail(JSON.stringify(body, null, 2), "  ")})
});
const data = await res.json();
console.log(data);`;
  }

  const methodLine =
    method === "GET" ? "" : `\n  method: ${JSON.stringify(method)},`;
  return `const res = await fetch(${JSON.stringify(url)}, {${methodLine}
  headers: { apikey: ${JSON.stringify(apiKey)} }
});
const data = await res.json();
console.log(data);`;
}

function nodeSample(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body: SampleBody | null
): string {
  const options: string[] = [];
  if (method !== "GET") options.push(`    method: ${JSON.stringify(method)}`);
  if (body) {
    options.push(
      `    headers: {\n      apikey: ${JSON.stringify(
        apiKey
      )},\n      "Content-Type": "application/json"\n    }`
    );
    options.push(
      `    body: JSON.stringify(${indentTail(
        JSON.stringify(body, null, 2),
        "    "
      )})`
    );
  } else {
    options.push(`    headers: { apikey: ${JSON.stringify(apiKey)} }`);
  }

  return `async function main() {
  const res = await fetch(${JSON.stringify(url)}, {
${options.join(",\n")}
  });

  if (!res.ok) {
    throw new Error("Request gagal dengan status " + res.status);
  }

  const data = await res.json();
  console.log(data);
}

main().catch(console.error);`;
}

function phpSample(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body: SampleBody | null
): string {
  const options: string[] = [
    `  CURLOPT_URL => ${JSON.stringify(url)}`,
    `  CURLOPT_RETURNTRANSFER => true`,
  ];
  if (method !== "GET") {
    options.push(`  CURLOPT_CUSTOMREQUEST => ${JSON.stringify(method)}`);
  }
  if (body) {
    options.push(`  CURLOPT_POSTFIELDS => json_encode(${phpArray(body, "  ")})`);
  }

  const headers = [`"apikey: ${apiKey}"`];
  if (body) headers.push(`"Content-Type: application/json"`);
  options.push(
    `  CURLOPT_HTTPHEADER => [\n${headers
      .map((header) => `    ${header}`)
      .join(",\n")}\n  ]`
  );

  return `<?php

$curl = curl_init();

curl_setopt_array($curl, [
${options.join(",\n")}
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;`;
}

function pythonSample(
  method: HttpMethod,
  url: string,
  apiKey: string,
  body: SampleBody | null
): string {
  const fn = method.toLowerCase();
  const payload = body ? `\npayload = ${pyDict(body)}` : "";
  const args = body
    ? "url, headers=headers, json=payload"
    : "url, headers=headers";

  return `import requests

url = ${JSON.stringify(url)}
headers = {"apikey": ${JSON.stringify(apiKey)}}${payload}

r = requests.${fn}(${args})
print(r.json())`;
}

/**
 * Build runnable-looking request samples for an endpoint in six
 * languages/tools, using the documented example request when available.
 */
export function buildSamples(
  endpoint: ApiEndpoint,
  apiBase: string,
  apiKey = "Tpz-username"
): CodeSample[] {
  const url = apiBase + buildRequestPath(endpoint);
  const body = buildBody(endpoint);
  const method = endpoint.method;

  return [
    { label: "cURL", language: "bash", code: curlSample(method, url, apiKey, body) },
    { label: "Axios", language: "javascript", code: axiosSample(method, url, apiKey, body) },
    { label: "Fetch", language: "javascript", code: fetchSample(method, url, apiKey, body) },
    { label: "Node.js", language: "javascript", code: nodeSample(method, url, apiKey, body) },
    { label: "PHP", language: "php", code: phpSample(method, url, apiKey, body) },
    { label: "Python", language: "python", code: pythonSample(method, url, apiKey, body) },
  ];
}
