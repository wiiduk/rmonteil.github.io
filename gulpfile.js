const gulp = require("gulp");
const fs = require("fs");
const path = require("path");
const through = require('through2');
const hljs = require('highlight.js');
const replace = require('gulp-replace');
const browserSync = require('browser-sync').create();
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

var md2html = () => {
    return through.obj(function (chunk, _enc, cb) {
        var fileContent = chunk.contents.toString("utf-8");
        var filePath = path.parse(chunk.path);
        var htmlFile = chunk.clone();
        htmlFile.contents = Buffer.from(md.render(fileContent));
        htmlFile.path = path.join(filePath.dir, filePath.name + ".html");

        cb(null, htmlFile);
    });
}

const populateHomePage = () => {
    const cardTpl = fs.readFileSync("./src/templates/components/article-card.html").toString();
    console.log("cardTpl:", cardTpl);
    const articles = [];
    const articleFiles = fs.readdirSync(path.join(__dirname, "articles"));
    console.log("articleFiles:", articleFiles);
    articleFiles.forEach(function (filename) {
        const filePath = path.join(__dirname, "articles", filename);
        const stats = fs.lstatSync(filePath);
        if (stats.isFile()) {
            const fileContent = fs.readFileSync(filePath, 'utf-8').toString();
            articles.push(cardTpl
                .replace("@ARTICLE_IMAGE@", path.join("./", filename).replace(".html", "") + ".jpg")
                .replace("@ARTICLE_TITLE@", /<h1>(.+)<\/h1>\n/.exec(fileContent)[1])
                .replace("@ARTICLE_CONTENT@", "")
                .replace("@ARTICLE_PATH@", path.join("./articles/", filename))
            );
        }
    });
    console.log("articles", articles);

    return gulp.src(path.join(__dirname, "src/templates/index.html"))
        .pipe(replace("@ARTICLES@", articles.join("")))
        .pipe(gulp.dest("./"));

    // return gulp.src(path.join(__dirname, "./articles/**/*.html"))
    //     .pipe(through.obj(function (chunk, _enc, cb) {
    //         var fileContent = chunk.contents.toString("utf-8");
    //         var filePath = path.parse(chunk.path);
    //         var htmlFile = chunk.clone();
    //         htmlFile.contents = Buffer.from(md.render(fileContent));
    //         htmlFile.path = path.join(filePath.dir, filePath.name + ".html");

    //         // Lister les articles créés
    //         // Créer le template html de la vignette
    //         // Récupérer le contenu de templates/index.html
    //         // Coller tout ça dans ./index.html

    //         cb(null, htmlFile);
    //     }))
    //     .pipe(replace("", ""))
    //     .pipe(gulp.dest("./index.html"));
};

const generateHtmlFiles = () => {
    return gulp.src(path.join(__dirname, "src/articles/**/*.md"))
        .pipe(md2html())
        .pipe(gulp.dest("./articles"))
};

gulp.task("build", gulp.series(generateHtmlFiles, populateHomePage));

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch("*.html").on("change", browserSync.reload);
});
