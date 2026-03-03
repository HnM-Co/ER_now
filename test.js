import https from 'https';

const url = 'https://apis.data.go.kr/B552657/ErmctInfoInqireService/getSrsillDissAceptncPosblInfoInqire?serviceKey=a0f92aac1356efd3339d4c1a42571bc0420edd9fe0a5b9c4a4ee02386223cf60&pageNo=1&numOfRows=10';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
