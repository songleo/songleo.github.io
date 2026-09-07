import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

class Element extends EventTarget {
  attrs = new Map();
  classes = new Set();
  style = { setProperty: (name, value) => (this.style[name] = value) };
  classList = {
    toggle: (name, enabled) =>
      enabled ? this.classes.add(name) : this.classes.delete(name),
  };
  setAttribute(name, value) {
    this.attrs.set(name, value);
  }
  getAttribute(name) {
    return this.attrs.get(name);
  }
}

function browser() {
  const root = new Element();
  Object.assign(root, { scrollTop: 0, scrollHeight: 1000, clientHeight: 500 });
  const elements = new Map(
    [
      "#btt-btn-container",
      "[data-button='back-to-top']",
      "#progress-indicator",
      "#myBar",
      "#theme-btn",
      "meta[name='theme-color']",
    ].map(selector => [selector, new Element()])
  );
  const document = Object.assign(new EventTarget(), {
    documentElement: root,
    firstElementChild: root,
    body: new Element(),
    querySelector: selector => elements.get(selector) ?? null,
  });
  const scrollCalls = [];
  const window = Object.assign(new EventTarget(), {
    getComputedStyle: () => ({ backgroundColor: "rgb(0, 0, 0)" }),
    scrollTo: options => scrollCalls.push(options),
  });
  let frameId = 0;
  const frames = new Map();
  const values = new Map();
  const context = vm.createContext({
    document,
    window,
    AbortController,
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    requestAnimationFrame: callback => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: id => frames.delete(id),
  });
  return {
    context,
    document,
    window,
    root,
    elements,
    frames,
    values,
    scrollCalls,
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback());
    },
  };
}

function runScript(environment, path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  });
  vm.runInContext(outputText, environment.context);
}

function loadSearch(environment, rememberBackUrl, PagefindUI) {
  const page = readFileSync(
    new URL("../src/pages/search.astro", import.meta.url),
    "utf8"
  );
  const source = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  const { outputText } = ts.transpileModule(
    source.replaceAll("import.meta.env.DEV", "false"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }
  );
  Object.assign(environment.context, {
    URLSearchParams,
    exports: {},
    require: id => {
      if (id === "@/utils/backUrl") return { rememberBackUrl };
      if (id === "@pagefind/default-ui") return { PagefindUI };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  vm.runInContext(outputText, environment.context);
}

test("search clearing accepts button clicks and keeps return URLs in sync", async () => {
  const env = browser();
  const input = new Element();
  input.value = "astro";
  const clear = new Element();
  const search = new Element();
  Object.assign(search, {
    dataset: { bundlePath: "/pagefind/", backurl: "/search/" },
    isConnected: true,
    querySelector: () => null,
  });
  env.elements.set("#pagefind-search", search);
  env.elements.set(".pagefind-ui__search-input", input);
  env.elements.set(".pagefind-ui__search-clear", clear);
  const idle = [];
  env.window.location = { pathname: "/search/", search: "?q=astro&sort=date" };
  env.window.requestIdleCallback = callback => idle.push(callback);
  const urls = [];
  const returns = [];
  const state = { marker: "preserve-router-state" };
  env.context.history = {
    state,
    replaceState: (nextState, _, url) => {
      assert.equal(nextState, state);
      urls.push(url);
    },
  };
  let processTerm;
  class PagefindUI {
    constructor(options) {
      processTerm = options.processTerm;
    }
    triggerSearch(term) {
      processTerm(term);
    }
  }
  loadSearch(env, url => returns.push(url), PagefindUI);
  await idle.shift()();
  assert.equal(urls.at(-1), "/search/?q=astro&sort=date");
  // A button has no input value; this used to throw when reading e.target.value.
  clear.dispatchEvent(new Event("click"));
  assert.equal(urls.at(-1), "/search/?sort=date");
  assert.equal(returns.at(-1), "/search/?sort=date");
  processTerm(""); // A delayed search callback must not resurrect q=.
  assert.equal(urls.at(-1), "/search/?sort=date");
  processTerm("new term");
  assert.equal(urls.at(-1), "/search/?sort=date&q=new+term");
  input.value = "";
  input.dispatchEvent(new Event("input"));
  assert.equal(urls.at(-1), "/search/?sort=date");
});

test("deferred search initialization stops after navigation or prior initialization", async () => {
  for (const existingForm of [false, true]) {
    const env = browser();
    const search = new Element();
    Object.assign(search, {
      dataset: { bundlePath: "/pagefind/" },
      isConnected: true,
      querySelector: () => (existingForm ? new Element() : null),
    });
    env.elements.set("#pagefind-search", search);
    env.window.location = { pathname: "/search/", search: "" };
    const idle = [];
    env.window.requestIdleCallback = callback => idle.push(callback);
    let initializations = 0;
    loadSearch(
      env,
      () => {},
      class {
        constructor() {
          initializations++;
        }
      }
    );
    if (!existingForm) search.isConnected = false;
    await idle.shift()();
    assert.equal(initializations, 0);
  }
});

test("scroll progress initializes restored positions and clamps edge cases", () => {
  const env = browser();
  env.root.scrollTop = 250;
  runScript(env, "../src/scripts/scroll-progress.ts");
  env.document.dispatchEvent(new Event("astro:page-load"));
  const bar = env.elements.get("#myBar");
  const container = env.elements.get("#btt-btn-container");
  assert.equal(bar.style.width, "50%");
  assert.equal(container.style.visibility, "visible");
  for (const [top, height, expected] of [
    [-10, 1000, "0%"],
    [1000, 1000, "100%"],
    [0, 500, "0%"],
  ]) {
    Object.assign(env.root, { scrollTop: top, scrollHeight: height });
    env.window.dispatchEvent(new Event("resize"));
    env.flush();
    assert.equal(bar.style.width, expected);
  }
  assert.equal(container.style.visibility, "hidden");
});

test("navigation disposes scroll listeners, pending frames and button handlers", () => {
  const env = browser();
  runScript(env, "../src/scripts/scroll-progress.ts");
  for (let navigation = 0; navigation < 4; navigation++) {
    env.document.dispatchEvent(new Event("astro:page-load"));
    env.document.dispatchEvent(new Event("scroll"));
    env.document.dispatchEvent(new Event("scroll"));
    assert.equal(env.frames.size, 1);
    env.elements
      .get("[data-button='back-to-top']")
      .dispatchEvent(new Event("click"));
    assert.equal(env.scrollCalls.length, navigation + 1);
    env.document.dispatchEvent(new Event("astro:before-swap"));
    assert.equal(env.frames.size, 0);
    env.document.dispatchEvent(new Event("scroll"));
    env.window.dispatchEvent(new Event("resize"));
    assert.equal(env.frames.size, 0);
  }
  env.elements.clear();
  env.document.dispatchEvent(new Event("astro:page-load"));
  env.document.dispatchEvent(new Event("scroll"));
  assert.equal(env.frames.size, 0);
  assert.equal(env.scrollCalls.length, 4);
});

test("theme remains usable when reading or writing storage throws", () => {
  const env = browser();
  env.context.localStorage = {
    getItem() {
      throw new Error("Storage blocked");
    },
    setItem() {
      throw new Error("Storage blocked");
    },
  };
  const button = env.elements.get("#theme-btn");
  button.setAttribute("aria-label", "切换明暗主题");
  runScript(env, "../src/scripts/theme.ts");
  assert.equal(env.root.getAttribute("data-theme"), "dark");
  button.dispatchEvent(new Event("click"));
  assert.equal(env.root.getAttribute("data-theme"), "light");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  assert.equal(button.getAttribute("aria-label"), "切换明暗主题");
  const replacement = new Element();
  env.elements.set("#theme-btn", replacement);
  env.document.dispatchEvent(new Event("astro:after-swap"));
  assert.equal(env.root.getAttribute("data-theme"), "light");
  replacement.dispatchEvent(new Event("click"));
  assert.equal(env.root.getAttribute("data-theme"), "dark");
});

test("inline and interactive theme initialization reject invalid stored values", () => {
  const layout = readFileSync(
    new URL("../src/layouts/Layout.astro", import.meta.url),
    "utf8"
  );
  const inline = [...layout.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .find(source => source.includes("window.__theme"));
  assert.ok(inline);
  for (const stored of ["light", "dark", "auto", "", null]) {
    const expected = stored === "light" ? "light" : "dark";
    const env = browser();
    env.values.set("theme", stored);
    vm.runInContext(inline, env.context);
    assert.equal(env.root.getAttribute("data-theme"), expected);
    runScript(env, "../src/scripts/theme.ts");
    assert.equal(env.root.getAttribute("data-theme"), expected);
  }
  const env = browser();
  env.context.localStorage = {
    getItem() {
      throw new Error("Storage blocked");
    },
  };
  vm.runInContext(inline, env.context);
  assert.equal(env.root.getAttribute("data-theme"), "dark");
});

test("copy buttons report success and permission failures without unhandled rejections", async () => {
  const source = readFileSync(
    new URL("../src/pages/posts/[...slug]/index.astro", import.meta.url),
    "utf8"
  );
  const start = source.indexOf("  function attachCopyButtons()");
  const end = source.indexOf("  attachCopyButtons();", start);
  assert.ok(start >= 0 && end > start);
  for (const rejected of [false, true]) {
    const copied = [];
    const timers = [];
    const buttons = [];
    const block = {
      querySelector: selector =>
        selector === "code"
          ? { innerText: "echo hello" }
          : (buttons[0] ?? null),
      setAttribute() {},
      appendChild: button => buttons.push(button),
      parentNode: { insertBefore() {} },
    };
    const context = vm.createContext({
      document: {
        querySelectorAll: () => [block],
        createElement: () => ({
          style: {},
          setAttribute() {},
          appendChild() {},
          addEventListener(name, callback) {
            this[name] = callback;
          },
        }),
      },
      getComputedStyle: () => ({ getPropertyValue: () => "" }),
      navigator: {
        clipboard: {
          async writeText(text) {
            if (rejected) throw new Error("Permission denied");
            copied.push(text);
          },
        },
      },
      setTimeout: callback => timers.push(callback),
    });
    vm.runInContext(
      source.slice(start, end) + "attachCopyButtons(); attachCopyButtons();",
      context
    );
    assert.equal(buttons.length, 1);
    const button = buttons[0];
    await button.click();
    assert.equal(button.disabled, true);
    assert.equal(
      button.textContent,
      rejected ? "复制失败，请手动选择代码" : "已复制"
    );
    assert.deepEqual(copied, rejected ? [] : ["echo hello"]);
    timers.forEach(callback => callback());
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, "复制");
  }
});
