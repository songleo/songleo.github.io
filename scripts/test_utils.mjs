import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const config = { site: { lang: "zh-cn" }, posts: { scheduledPostMargin: 0 } };

// Supply Astro's virtual config/env modules while executing the real utilities.
function loadUtility(name, globals = {}, cache = new Map()) {
  if (cache.has(name)) return cache.get(name);
  const source = readFileSync(
    new URL(`../src/utils/${name}.ts`, import.meta.url),
    "utf8"
  );
  const { outputText } = ts.transpileModule(
    source.replaceAll("import.meta.env.DEV", "false"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }
  );
  const module = { exports: {} };
  const resolve = id => {
    if (id === "@/config") return config;
    if (id.startsWith("./")) return loadUtility(id.slice(2), globals, cache);
    return require(id);
  };
  new Function(
    "require",
    "module",
    "exports",
    ...Object.keys(globals),
    outputText
  )(resolve, module, module.exports, ...Object.values(globals));
  cache.set(name, module.exports);
  return module.exports;
}

test("archive grouping uses publication timezone at month and year boundaries", () => {
  const { getArchiveDate } = loadUtility("getArchiveDate");
  assert.deepEqual(
    getArchiveDate(new Date("2018-03-01T00:05:00+08:00"), "Asia/Shanghai"),
    { year: 2018, month: 3 }
  );
  assert.deepEqual(
    getArchiveDate(new Date("2026-01-01T00:05:00+08:00"), "Asia/Shanghai"),
    { year: 2026, month: 1 }
  );
  assert.deepEqual(
    getArchiveDate(new Date("2026-01-01T00:05:00+08:00"), "UTC"),
    { year: 2025, month: 12 }
  );
  assert.deepEqual(
    getArchiveDate(new Date("2026-03-01T04:00:00Z"), "America/New_York"),
    { year: 2026, month: 2 }
  );
});

test("archive grouping is independent of the build machine timezone", () => {
  const { getArchiveDate } = loadUtility("getArchiveDate");
  const previous = process.env.TZ;
  try {
    for (const timezone of ["UTC", "America/Los_Angeles", "Asia/Shanghai"]) {
      process.env.TZ = timezone;
      assert.deepEqual(
        getArchiveDate(new Date("2026-09-01T00:12:05+08:00"), "Asia/Shanghai"),
        { year: 2026, month: 9 }
      );
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("tag deduplication keeps first labels, sorting and publication filtering", () => {
  const { getUniqueTags } = loadUtility("getUniqueTags");
  const post = (tags, overrides = {}) => ({
    data: { tags, pubDatetime: new Date("2020-01-01T00:00:00Z"), ...overrides },
  });
  const posts = [
    post(["Python", "学习笔记", "python"]),
    post(["学习笔记", "Astro", "PYTHON"]),
    post(["draft-tag"], { draft: true }),
    post(["future-tag"], { pubDatetime: new Date("2999-01-01T00:00:00Z") }),
  ];
  const original = structuredClone(posts);
  assert.deepEqual(getUniqueTags(posts), [
    { tag: "学习笔记", tagName: "学习笔记" },
    { tag: "astro", tagName: "Astro" },
    { tag: "python", tagName: "Python" },
  ]);
  assert.deepEqual(posts, original);
  assert.deepEqual(getUniqueTags([]), []);
});

function backUrls(storage = new Map()) {
  const location = new URL("https://example.com/blog/posts/article/");
  const sessionStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  return {
    ...loadUtility("backUrl", { window: { location }, sessionStorage }),
    storage,
    sessionStorage,
  };
}

test("return URLs retain pagination, encoded queries and anchors across reloads", () => {
  const env = backUrls();
  env.rememberBackUrl("/blog/tags/python/2/?q=a%26b#results");
  const expected = "https://example.com/blog/tags/python/2/?q=a%26b#results";
  assert.equal(env.readBackUrl(), expected);
  assert.equal(backUrls(env.storage).readBackUrl(), expected);
  env.rememberBackUrl("/blog/posts/3/");
  assert.equal(env.readBackUrl(), "https://example.com/blog/posts/3/");
});

test("return URLs reject external, executable, credentialed and malformed values", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,example",
    "//external.example/path",
    "https://external.example/",
    "https://example.com.evil.test/",
    "http://example.com/",
    "https://user@example.com/",
    "http://[bad/",
    "",
    "  ",
  ]) {
    const env = backUrls(new Map([["backUrl", value]]));
    assert.equal(env.readBackUrl(), null, value);
    env.rememberBackUrl(value);
    assert.equal(env.readBackUrl(), null, value);
  }
  const env = backUrls();
  env.rememberBackUrl("https://example.com//external.example/path");
  assert.equal(new URL(env.readBackUrl()).origin, "https://example.com");
});

test("blocked session storage uses the latest in-memory return URL", () => {
  const env = backUrls();
  env.sessionStorage.getItem = () => {
    throw new Error("Storage blocked");
  };
  env.sessionStorage.setItem = () => {
    throw new Error("Storage blocked");
  };
  assert.equal(env.readBackUrl(), null);
  env.rememberBackUrl("/blog/posts/2/");
  assert.equal(env.readBackUrl(), "https://example.com/blog/posts/2/");
  env.rememberBackUrl("/blog/tags/astro/");
  assert.equal(env.readBackUrl(), "https://example.com/blog/tags/astro/");
});

test("failed storage writes do not restore an older stored return URL", () => {
  const env = backUrls(new Map([["backUrl", "/blog/posts/2/"]]));
  env.sessionStorage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  env.rememberBackUrl("/blog/posts/4/");
  assert.equal(env.readBackUrl(), "https://example.com/blog/posts/4/");
});
