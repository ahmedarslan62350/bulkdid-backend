// ?? DEEPSEEK_API

// const http = require('https');

// const options = {
// 	method: 'POST',
// 	hostname: 'chatgpt-42.p.rapidapi.com',
// 	port: null,
// 	path: '/deepseekai',
// 	headers: {
// 		'x-rapidapi-key': '7bbd4dd041mshf4ce0627e4107a6p1c2f71jsncef42506117a',
// 		'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
// 		'Content-Type': 'application/json'
// 	}
// };

// const req = http.request(options, function (res) {
// 	const chunks = [];

// 	res.on('data', function (chunk) {
// 		chunks.push(chunk);
// 	});

// 	res.on('end', function () {
// 		const body = Buffer.concat(chunks);
// 		console.log(body.toString());
// 	});
// });

// req.write(JSON.stringify({
//   messages: [
//     {
//       role: 'user',
//       content: 'can you give me code of js to write hello world in console'
//     }
//   ],
//   web_access: false
// }));
// req.end();


// ?? OPENAI_API

// const http = require('https');

// const options = {
// 	method: 'POST',
// 	hostname: 'chatgpt-42.p.rapidapi.com',
// 	port: null,
// 	path: '/deepseekai',
// 	headers: {
// 		'x-rapidapi-key': '7bbd4dd041mshf4ce0627e4107a6p1c2f71jsncef42506117a',
// 		'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
// 		'Content-Type': 'application/json'
// 	}
// };

// const req = http.request(options, function (res) {
// 	const chunks = [];

// 	res.on('data', function (chunk) {
// 		chunks.push(chunk);
// 	});

// 	res.on('end', function () {
// 		const body = Buffer.concat(chunks);
// 		console.log(body.toString());
// 	});
// });

// req.write(JSON.stringify({
//   messages: [
//     {
//       role: 'user',
//       content: 'hello'
//     }
//   ],
//   web_access: false
// }));
// req.end();