const Express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');

const GoogleSpreadSheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./credenciais.json');
const dotenv = require('dotenv');

//configura modulo de leitura de variaveis de ambiente
dotenv.config();

const app = Express();
const porta = process.env.PORT || 5000;

//express-handlebars
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    console.log('Requisição GET -> / : ' + getDataEHora());
    console.log(' -> Redirecionado para index da aplicação');
    res.render('index');
});

app.get('/candidatos', (req, res) => {
    console.log('Requisição GET -> /candidatos : ' + getDataEHora());
    console.log(' -> Redirecionado para página de consulta candidatos');
    res.render('candidatos');
});

app.get('/cadastros', (req, res) => {
    console.log('Requisição GET -> /cadastros : ' + getDataEHora());
    (async function accessSpreadSheet() {
        const doc = new GoogleSpreadSheet(process.env.SHEET_ID);
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        const rows = await promisify(sheet.getRows)({
            offset: 1
        })
        console.log(' -> Dados retornados de spreadsheet: ' + process.env.SHEET_ID);
        console.log(' -> Quantidade de dados: ' + rows.length);
        res.send(rows);
    })()
});

app.get('/chatbot', (req, res) => {
    console.log('Requisição GET -> /chatbot : ' + getDataEHora());
    console.log(' -> Redirecionado para página de chatbot');
    res.render('chatbot');
});

//insere candidato por meio de JSON no corpo da requisição 
app.post('/inserirDados', (req, res) => {
    console.log('Requisição POST -> /inserirDados : ' + getDataEHora());
    console.log(' -> Requisição externa');
    (async function inserirDados() {
        const doc = new GoogleSpreadSheet(process.env.SHEET_ID);
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        await promisify(sheet.addRow)({
            Nome: req.body.Nome,
            Email: req.body.Email,
            //DtNasc: req.body.DtNasc,
            Interesse: req.body.Interesse
        });
        console.log(' -> Objeto recebido: ');
        console.table({
            Nome: req.body.Nome,
            Email: req.body.Email,
            //DtNasc: req.body.DtNasc,
            Interesse: req.body.Interesse
        });
        res.send({
            Nome: req.body.Nome,
            Email: req.body.Email,
            //DtNasc: req.body.DtNasc,
            Interesse: req.body.Interesse
        });
    })()
});

app.post('/inserir', (req, res) => {
    console.log('Requisição POST -> /inserir : ' + getDataEHora());
    console.log(' -> Requisição via formulário');
    const row = {
        Nome: req.body.nome,
        Email: req.body.email,
        //DtNasc: formatarDataPadraoBR(req.body.dtNasc),
        Interesse: req.body.interesse
    };
    (async function inserirDados() {
        const doc = new GoogleSpreadSheet(process.env.SHEET_ID);
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        await promisify(sheet.addRow)(row);
        console.table(row);
        res.redirect('/');
    })()
});

app.listen(porta, () => {
    console.log(`Servidor ouvindo na porta ${porta}`);
});

function formatarDataPadraoBR(dataPadraoUS) {
    return dataPadraoUS.split('-').reverse().join('/');
}

function getDataEHora() {
    let data = new Date();
    return `Data: ${data.getDate()}/${data.getMonth()+1}/${data.getFullYear()} - ${data.getHours()}:${data.getMinutes()}`;
}