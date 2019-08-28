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
    console.log('Requisição GET - /');
    res.render('index', {
        nome: 'Aplicação teste de Google Sheets API'
    })
});

//insere candidatos a partir do formulário do front da aplicação
app.get('/candidatos', (req, res) => {
    console.log('Requisição GET - /candidatos');
    (async function accessSpreadSheet() {
        const doc = new GoogleSpreadSheet(process.env.SHEET_ID);
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        const rows = await promisify(sheet.getRows)({
            offset: 1
        })
        res.render('candidatos',{
            candidatos: rows
        });
    })()
});

//insere candidato por meio de JSON no corpo da requisição 
app.post('/inserirDados', (req, res) => {
    console.log('Requisição POST - /inserir');
    (async function inserirDados() {
        const doc = new GoogleSpreadSheet(process.env.SHEET_ID);
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        await promisify(sheet.addRow)({
            Nome: req.body.Nome,
            Email: req.body.Email,
            Interesse: req.body.Interesse
        });
        res.send({
            Nome: req.body.Nome,
            Email: req.body.Email,
            Interesse: req.body.Interesse
        });
        console.log(`Nome: ${req.body.Nome},
            Email: ${req.body.Email},
            Interesse: ${req.body.Interesse}`);
    })()
});

app.post('/inserir', (req, res) => {
    const row = {
        Nome: req.body.nome,
        Email: req.body.email,
        Interesse: req.body.interesse
    };
    (async function inserirDados() {
        const doc = new GoogleSpreadSheet(process.env.SHEET_ID);
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        await promisify(sheet.addRow)(row);
        res.redirect('/candidatos');
    })()
});

app.listen(porta, () => {
    console.log(`Servidor ouvindo na porta ${porta}`);
});
