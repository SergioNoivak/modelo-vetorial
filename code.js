var isStoppword = require('./stopwords.json');
var fs = require('fs'),
    path = require('path')
filePath = path.join(__dirname, 'documentos/');
let scanf = require('scanf');


let scopus = {};

let remover_stoppwords = (tokens) => {
    var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

    let indices = [];
    tokens.forEach(element => {
        if (!isStoppword[element] && !format.test(element))
            indices.push(element.replace(',;.', ''))

    });

    console.log(indices)
    return indices;
}

const testFolder = './documentos/';
console.log("Digite a query de busca:")
let query = scanf("%S");


function construirFrequencias(indices) {
    let tabela_frequencia = {};
    let maior_frequencia = {
        termo: undefined,
        frequencia: -1
    }

    indices.forEach((el) => {
        if (scopus[el] == undefined){
            scopus[el] = 1;

        }
        else
            scopus[el]++;



        if (tabela_frequencia[el] == undefined) {
            tabela_frequencia[el] = 1;
        } else {
            tabela_frequencia[el]++;


            if (tabela_frequencia["" + el] > maior_frequencia['frequencia']) {
                maior_frequencia['termo'] = el;
                maior_frequencia['frequencia'] = tabela_frequencia["" + el];
            }
        }
    })
    return {
        "tabela_frequencia": tabela_frequencia,
        "maior_frequencia": maior_frequencia
    }
}
function construirTFs_IDF(dados_frequencia,tamanho_scopus){

    let TFs = {};
    let IDFs = {};
    let final = {};
    for(let propriedade in dados_frequencia.tabela_frequencia){
        TFs[propriedade] = dados_frequencia.tabela_frequencia[propriedade]/dados_frequencia.maior_frequencia.frequencia;
        IDFs[propriedade] = tamanho_scopus/scopus[propriedade]
        final[propriedade] =+TFs[propriedade] * (+IDFs[propriedade])


    }

    dados_frequencia.TFs = TFs;
    dados_frequencia.IDFs = IDFs;
    dados_frequencia.final = final;
}




async function decidirArquivo(file) {

    return new Promise(function (resolveArquivo, rejectArquivo) {
        fs.readFile(filePath + file, {
            encoding: 'utf-8'
        }, function (err, data) {
            if (!err) {

                let tokens = data.match(/\S+/g)
                let indices = remover_stoppwords(tokens);

                let dados_frequencia = construirFrequencias(indices)

                resolveArquivo({nome_arquivo:file,dados_frequencia:dados_frequencia})


            } else {
                console.log(err);
            }
        });
    })
}

async function lerDiretorio() {

    return new Promise(function (resolveDiretorio, rejectDiretorio) {
        let arquivosContabilizados = []
        fs.readdir(testFolder, async (err, files) => {

            for (let i = 0; i < files.length; i++) {
                let leitura = await decidirArquivo(files[i])
                if (leitura != null)
                    arquivosContabilizados.push(leitura)
            }

            resolveDiretorio(arquivosContabilizados)

        })
    })
}

lerDiretorio().then(arquivosContabilizados => {

    console.log('arquivosContabilizados: ', arquivosContabilizados)
    for(let i=0 ; i<arquivosContabilizados.length;i++){
        construirTFs_IDF(arquivosContabilizados[i].dados_frequencia,arquivosContabilizados.length)
        console.log(arquivosContabilizados[i].dados_frequencia)

    }


})