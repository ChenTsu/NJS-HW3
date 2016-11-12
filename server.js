var fs = require('fs');
var http = require('http');
var urlutils = require('url');
var req = require('request');
var cheer_io = require('cheerio');

var PORT = 8000;

http.createServer( function (request, response) {

    var params = urlutils.parse('http://localhost:8000'+request.url, true); // кусочки разпарсеного запроса
    // console.log(params);

    if ( params.path === '/news') {
        console.log('ща будут новости');
        // передать response в качестве параметра это походу единственный способ дождаться ответа
        // пока response будет мотыляться в другой функции, callback-функция для createServer будет ждать(как я понял)
        // иначе node запустив callback помчится выполнять код дальше, не дожидаясь результатов
        // или node ждёт response.end() ?
        getNews(response);
    }
    else
    {
        var defaultAnswer ='Try <a href="/news">this page</a>';// то что отдадим в ответ на обращение
        // пишем http-заголовок ответа
         response.writeHead(200, {
                                  'Content-Type': 'text/html; charset=utf-8',
                                  'Content-Length': defaultAnswer.length     }
         );
        // пишем тело ответа
         response.write(defaultAnswer);
        // закрываем запрос и отправляем ответ
        response.end();
    }

})
.listen(PORT, function () {
    console.log('Server started on port: ', PORT);
});

function getNews(responseOnRequestToServer) {
    console.log('посылаем гонца за новостями');
    req('http://news.google.ru', function (error, newsResponse, body) {
        var news='';
        if (!error && newsResponse.statusCode == 200) {
            responseOnRequestToServer.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                // 'Content-Length': news.length
            });

            news = fs.readFileSync('./view/header.html');
            responseOnRequestToServer.write(news);

            var $ = cheer_io.load(body);  // загружаем страницу новостей
            $('.esc-body').each(function (i, element)
            {
                news ='<div class="news">';
                news +='<div class="news-title"><a href="'+$(element).find('.esc-lead-article-title > a').attr('url')+'" >'+ $(element).find('.esc-lead-article-title > a > span').text().trim() + '</a></div>';
                news +='<div class="news-text">'+$(element).find('.esc-lead-snippet-wrapper').text().trim() +'</div></div>';
                responseOnRequestToServer.write(news);
            });

            news = fs.readFileSync('./view/bottom.html');
            responseOnRequestToServer.write(news);

            // fs.createReadStream('index.html').pipe(responseOnRequestToServer); // потоком выдаёт файл на запрос, удобно если не нужно менять файл
            // fs.readFile('./index.html', 'utf8', function (err, data) {
            //     var _$ = cheer_io.load(data);
            //     _$('.wrap').append(news);
            //
            //     responseOnRequestToServer.write(_$.html());
            //     responseOnRequestToServer.end();
            // });
            responseOnRequestToServer.end();
            console.log('гонец успешно вернулся');
        }
        else
        {
            responseOnRequestToServer.end();
            console.error('гонца перехватили супостаты!');
        }
    });
}