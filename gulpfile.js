const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const through = require('through2');
const hljs = require('highlight.js');
const replace = require('gulp-replace');
const htmlmin = require('gulp-htmlmin');
const bs = require('browser-sync').create();
const md = require('markdown-it')({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value;
            } catch (__) { }
        }

        return ''; // use external default escaping
    }
});

// TODO gulp-uglify du html
// TODO charger le langage highlight selon ce qui est présent dans le code
// TODO Resize automatique des images
// TODO Intégrer la date de rédaction de l'article dans le nom du fichier html, sans écraser si modification
// TODO Afficher la date de dernière mise à jour de l'article dans le fichier html
// TODO Faire en sorte que l'affichage des articles de la page d'accueil soit "sympa" = pas toujours les mêmes rectangles
// TODO Gérer des catégories d'articles. Avoir une page par catégorie qui liste les articles

// BrowserSync
function browserSync(done) {
    bs.init({
        server: {
            baseDir: "./"
        },
        port: 3000
    });
    done();
}

// BrowserSync Reload
function browserSyncReload(done) {
    bs.reload();
    done();
}

const md2html = (template) => {
    return through.obj(function (chunk, _enc, cb) {
        const filePath = path.parse(chunk.path);
        const mdFileContent = chunk.contents.toString("utf-8");

        // Extract article's data
        const article = {
            title: mdFileContent.match(/^# (.+)\n+/m)[1],
            image: filePath.name + ".jpg",
            content: mdFileContent.replace(/^# (.+)\n+/m, ""),
        };

        // Generate HTML file
        article.content = md.render(article.content);
        article.content = article.content.replace(/<h2>(.*)<\/h2>/gm, '</div><h3 class="mdl-cell mdl-cell--12-col mdl-typography--headline">$1</h3><div class="mdl-cell mdl-cell--8-col mdl-card__supporting-text no-padding ">');
        if (article.content.substring(0, 3) !== "<h3") {
            article.content = '<div class="mdl-cell mdl-cell--8-col mdl-card__supporting-text no-padding ">' + article.content;
        }
        article.content += "</div>";

        // Replace placeholders by article's data
        template = template
            .replace("@ARTICLE_TITLE@", article.title)
            .replace("@ARTICLE_IMAGE@", article.image)
            .replace("@ARTICLE_CONTENT@", article.content);

        // Create buffer
        const htmlFile = chunk.clone();
        htmlFile.contents = Buffer.from(template);
        htmlFile.path = path.join(filePath.dir, filePath.name + ".html");

        cb(null, htmlFile);
    });
}

const generateHtmlArticles = () => {
    const template = fs.readFileSync("./src/templates/article.html").toString();

    return gulp.src(path.join(__dirname, "src/articles/**/*.md"))
        .pipe(md2html(template))
        .pipe(gulp.dest("./articles"));
};

const populateHomePage = () => {
    const cardTpl = fs.readFileSync("./src/templates/components/article-card.html").toString();
    const articles = [];
    const articleFiles = fs.readdirSync(path.join(__dirname, "articles"));
    articleFiles.forEach(function (filename) {
        const filePath = path.join(__dirname, "articles", filename);
        const stats = fs.lstatSync(filePath);
        if (stats.isFile()) {
            const fileContent = fs.readFileSync(filePath, 'utf-8').toString();
            articles.push(cardTpl
                .replace("@ARTICLE_IMAGE@", path.join("./", filename).replace(".html", "") + ".jpg")
                .replace("@ARTICLE_TITLE@", /<h2 class="mdl\-card__title-text">(.+)<\/h2>/.exec(fileContent)[1])
                .replace("@ARTICLE_CONTENT@", "")
                .replace("@ARTICLE_PATH@", path.join("./articles/", filename))
            );
        }
    });

    return gulp.src(path.join(__dirname, "src/templates/index.html"))
        .pipe(replace("@ARTICLES@", articles.join("")))
        .pipe(gulp.dest("./"));
};

const watchFiles = () => {
    gulp.watch(
        ["./src/articles/**/*.md", "./src/templates/**/*.html"],
        { ignoreInitial: false },
        gulp.series(
            generateHtmlArticles,
            populateHomePage,
            browserSyncReload
        )
    );
};

const minifyHtml = () => {
    return gulp.src(["index.html", "articles/**/*.html"], { base: '.' })
        .pipe(htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
        }))
        .pipe(gulp.dest('./'));
};

gulp.task("build", gulp.series(generateHtmlArticles, populateHomePage, minifyHtml));

gulp.task("watch", gulp.parallel(watchFiles, browserSync));
