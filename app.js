const Express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const GoogleSpreadSheet = require('google-spreadsheet');
const { promisify } = require('util');
const creds = require('./credenciais.json');

const app = Express();
const porta = 5000;

//express-handlebars
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index', {
        nome: 'Aplicação teste de Google Sheets API'
    })
});

app.get('/candidatos', (req, res) => {
    (async function accessSpreadSheet() {
        const doc = new GoogleSpreadSheet('1BjVQnZsan3PnRZK5HyThB1-UmnrpT8XuHA9Vgv7VGn0');
        await promisify(doc.useServiceAccountAuth)(creds);
        const info = await promisify(doc.getInfo)();
        const sheet = info.worksheets[0];
        const rows = await promisify(sheet.getRows)({
            offset: 1
        })
        //console.log(`Title: ${sheet.title}, Rows: ${sheet.rowCount}`);
        res.render('candidatos',{
            candidatos: rows
        });
    })()
});

app.post('/inserir', (req, res) => {
    const row = {
        Nome: req.body.nome,
        Email: req.body.email,
        Interesse: req.body.interesse
    };
    (async function inserirDados() {
        const doc = new GoogleSpreadSheet('1BjVQnZsan3PnRZK5HyThB1-UmnrpT8XuHA9Vgv7VGn0');
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
