"""Regression tests for the publication gate, with disposable HTML fixtures."""

import tempfile
import unittest
from pathlib import Path

from check_content import check, srcset_urls


class ContentChecks(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.dist = Path(self.directory.name)
        self.write("index.html", '<title>Home</title>')

    def write(self, path, text):
        file = self.dist / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(text, encoding="utf-8")

    def issues(self):
        return check(self.dist, [])[2]

    def test_internal_routes_files_queries_fragments_and_case(self):
        self.write("guide/index.html", '<h2 id="hello">Hello</h2>')
        self.write("images/Photo.svg", "<svg/>")
        self.write("rss.xml", "<rss/>")
        self.write("index.html", '''
            <a href="/guide/#hello">Guide</a>
            <a href="https://reborncodinglife.com/guide?x=1#hello">Guide</a>
            <link rel="alternate" href="/rss.xml">
            <img alt="Photo" src="/images/Photo.svg?raw=true">
        ''')
        self.assertEqual([], self.issues())
        self.write("guide/index.html", '''
            <h2 id="hello">Hello</h2>
            <a href="../rss.xml">Feed</a><a href="#missing">Missing anchor</a>
            <img alt="Photo" src="/images/photo.svg">
            <link rel="alternate" href="/rss.xml/">
        ''')
        self.assertEqual(
            {"broken-local", "broken-fragment"},
            {issue[0] for issue in self.issues()},
        )
        self.assertEqual(3, len(self.issues()))

    def test_http_resources_links_and_quoted_code_are_distinct(self):
        self.write("index.html", '''
            <pre><code>&lt;img src="http://example.com/code.png"&gt;</code></pre>
            <a href="http://localhost:8080/">Local example</a>
            <img alt="Diagram" src="https://example.com/a.png"
                 srcset="http://example.com/a.png 1x, https://example.com/b.png 2x">
            <script src="http://example.com/script.js"></script>
            <video poster="http://example.com/poster.png"></video>
        ''')
        issues = self.issues()
        self.assertEqual(4, len(issues))
        self.assertEqual(3, sum(issue[0] == "http-resource" for issue in issues))

    def test_blank_rel_and_decorative_alt(self):
        self.write("index.html", '''
            <a target="_blank" rel="noopener noreferrer external" href="https://example.com/">Safe</a>
            <a target="_blank" href="https://example.com/unsafe">Unsafe</a>
            <img src="https://example.com/photo.png">
            <img alt="" role="presentation" src="https://example.com/decoration.png">
        ''')
        self.assertEqual({"unsafe-blank", "missing-alt"}, {i[0] for i in self.issues()})
        self.assertEqual(2, len(self.issues()))

    def test_srcset_data_urls_do_not_hide_following_resources(self):
        self.write("images/a,b.png", "image")
        self.write("index.html", '''
            <img alt="Diagram" srcset="data:image/png;base64,AAAA 1x,
                 http://example.com/insecure.png 2x, /images/missing.png 3x">
            <img alt="Diagram" srcset="/images/a,b.png 1x,
                 data:image/png;base64,BBBB 2x">
            <link rel="preload" as="image"
                  imagesrcset="/images/a,b.png 1x, /images/missing-preload.png 2x">
        ''')
        self.assertEqual([
            ("broken-local", "index.html", "/images/missing-preload.png"),
            ("broken-local", "index.html", "/images/missing.png"),
            ("http-resource", "index.html", "http://example.com/insecure.png"),
        ], self.issues())

    def test_srcset_tokenization_preserves_url_commas_and_skips_descriptors(self):
        self.assertEqual(
            ["/one.png", "data:image/png;base64,AAAA", "/three,a.png", "/four.png"],
            list(srcset_urls(" , /one.png,\n data:image/png;base64,AAAA 2x, "
                             "/three,a.png 3x, /four.png 4x")),
        )
        self.assertEqual(
            ["/one.png", "/two.png"],
            list(srcset_urls("/one.png future(a,b), /two.png 2x")),
        )
        self.assertEqual([], list(srcset_urls(" \t,\n")))

    def test_invalid_urls_are_reported_without_stopping_other_checks(self):
        self.write("index.html", '''
            <a href="http://[broken/">Malformed host</a>
            <a href="https://example.com:bad/path">Malformed port</a>
            <a href="/missing/">Missing page</a>
        ''')
        self.assertEqual(3, len(self.issues()))
        self.assertEqual(2, sum(i[0] == "invalid-url" for i in self.issues()))
        self.assertEqual(1, sum(i[0] == "broken-local" for i in self.issues()))

    def test_placeholder_urls_in_code_are_not_navigation_links(self):
        placeholder = "http://proxy.example:port"
        # Disposable local HTML only: neither this fixture nor check() uses I/O
        # over the network, and the example contains no authentication details.
        for markup in (
            f"<code>{placeholder}</code>",
            f"<pre><code>{placeholder}</code></pre>",
        ):
            with self.subTest(markup=markup):
                self.write("index.html", markup)
                self.assertEqual([], self.issues())
        self.write("index.html", f'<a href="{placeholder}">Proxy</a>')
        self.assertEqual(
            [("invalid-url", "index.html", placeholder)], self.issues()
        )

    def test_duplicate_open_graph_type_is_rejected(self):
        self.write("index.html", '''
            <meta property="og:type" content="website">
            <meta property="og:type" content="article">
        ''')
        self.assertEqual(
            [("duplicate-og-type", "index.html", "website, article")], self.issues()
        )

    def test_duplicate_titles_only_apply_to_articles(self):
        for name in ("one", "two"):
            self.write(f"posts/{name}/index.html", '<title>Same title</title><meta property="og:type" content="article">')
        for name in ("2", "3"):
            self.write(f"posts/{name}/index.html", '<title>Listing</title>')
        self.assertEqual(2, len(self.issues()))
        self.assertTrue(all(i[0] == "duplicate-title" for i in self.issues()))

    def test_exceptions_are_exact_and_stale_entries_fail(self):
        self.write("index.html", '<a href="http://localhost:8080/">Local</a>')
        entry = dict(kind="http-link", file="index.html", value="http://localhost:8080/", reason="Local example")
        self.assertEqual([], check(self.dist, [entry])[2])
        self.write("index.html", '<a href="http://localhost:9000/">New example</a>')
        self.assertEqual(1, len(check(self.dist, [entry])[2]))
        self.assertEqual(1, len(check(self.dist, [entry])[3]))

    def test_missing_build_and_empty_reason_fail(self):
        (self.dist / "index.html").unlink()
        with self.assertRaises(ValueError):
            self.issues()
        self.write("index.html", "")
        with self.assertRaises(ValueError):
            check(self.dist, [dict(kind="http-link", file="index.html", value="http://localhost/", reason="")])


if __name__ == "__main__":
    unittest.main()
