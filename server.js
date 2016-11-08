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
        // передать response в качкстве параметра это походу единственный способ дождаться ответа
        // пока response будет мотыляться в другой функции, эта callback-функция будет ждать(как я понял)
        // иначе node запустив callback помчится выполнять код дальше, не дожидаясь результатов
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
    req('http://news.google.ru', function (error, response, body) {
        var news='';
        if (!error && response.statusCode == 200) {
            var $ = cheer_io.load(body);  // загружаем страницу новостей
            $('.esc-body').each(function (i, element)
            {
                news +='<div class="news">';
                news +='<div class="news-title"><a href="'+$(element).find('.esc-lead-article-title > a').attr('url')+'" >'+ $(element).find('.esc-lead-article-title > a > span').text().trim() + '</a></div>';
                news +='<div class="news-text">'+$(element).find('.esc-lead-snippet-wrapper').text().trim() +'</div></div>';
            });

            responseOnRequestToServer.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': news.length
            });
            responseOnRequestToServer.write(news);
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