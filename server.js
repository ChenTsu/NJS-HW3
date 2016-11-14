var fs = require('fs');
var http = require('http');
var urlutils = require('url');
var req = require('request');
var cheer_io = require('cheerio');

var PORT = 8000;

http.createServer( function (request, response) {

    var params = urlutils.parse('http://localhost:8000'+request.url, true); // кусочки разпарсеного запроса
    // console.log(params);

    if ( params.pathname === '/news') {
        console.log('ща будут новости');
        // передать response в качестве параметра это походу единственный способ дождаться ответа
        // пока response будет мотыляться в другой функции, callback-функция для createServer будет ждать(как я понял)
        // иначе node запустив callback помчится выполнять код дальше, не дожидаясь результатов
        // или node ждёт response.end() ?
        getNews(response);
    }
    else if (params.pathname === '/translate')
    {
        console.log('посылаем гонца к толмачу');
        getTranslate(response, params);
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
                news +='<div class="news-title"><a href="'+$(element).find('.esc-lead-article-title > a').attr('url')+'" >'+ $(element).find('.esc-lead-article-title > a > span').text().trim() + '</a><button id="btn" type="button" class="trans-btn">Translate</button></div>';
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
function getTranslate(responseToClient, GETRequestParams) {
    // console.log(GETRequestParams.query.native);
        //Если свойство translate свойста query определено, обращаемся к яндекс-переводчику
     if (GETRequestParams.query.native) {
        var word = GETRequestParams.query.native;
         // word=word.replace(/"/g, '\\"');
         // console.log(word);

         //TODO: разобраться почему в callback в responseBody попадает урезанная версия ответа
        //Обращаемся к Яндекс.переводчику
        req.post('https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20161112T161318Z.6c3a4b81e417ae28.df471210579d8f150163b213710067ffe75860fc&lang=ru-en&format=html&text=' + word, function (error, response, responseBody) {
            if (!error && response.statusCode === 200) {
                //Распарсиваем html в объект
                // console.log(responseBody);
                var answer = JSON.parse(responseBody);
                answer = answer.text;
                answer[0].replace(/\\"/g, '"');
                // console.log(answer[0]);
                //Выводим значение свойства text полученного объекта.
                responseToClient.write(answer[0]);
                responseToClient.end();
            }
            else{
                console.log('толмач устал, гонца прогнал');
            }
        });
    }
}