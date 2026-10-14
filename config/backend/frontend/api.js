/*
|--------------------------------------------------------------------------
| API DO SENAI CONECTA
|--------------------------------------------------------------------------
*/

const API_URL = "../backend/index.php";


/*
|--------------------------------------------------------------------------
| FUNÇÃO PRINCIPAL DA API
|--------------------------------------------------------------------------
*/

async function api(acao, opcoes = {}) {

    try {

        const url =
            `${API_URL}?acao=${encodeURIComponent(acao)}`;

        const configuracao = {
            method: opcoes.method || "GET",
            credentials: "same-origin"
        };


        /*
        |--------------------------------------------------------------
        | Se o corpo for FormData, não definimos Content-Type.
        | O navegador fará isso automaticamente.
        |--------------------------------------------------------------
        */

        if (opcoes.body instanceof FormData) {

            configuracao.body = opcoes.body;

        } else if (opcoes.body) {

            configuracao.headers = {
                "Content-Type": "application/json"
            };

            configuracao.body =
                JSON.stringify(opcoes.body);
        }


        const resposta = await fetch(
            url,
            configuracao
        );


        const dados = await resposta.json();

        return dados;

    } catch (erro) {

        console.error(erro);

        return {
            sucesso: false,
            mensagem:
                "Não foi possível conectar ao servidor."
        };
    }
}