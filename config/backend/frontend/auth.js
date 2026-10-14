/*
|--------------------------------------------------------------------------
| AUTENTICAÇÃO
|--------------------------------------------------------------------------
*/

let usuarioAtual = null;


/*
|--------------------------------------------------------------------------
| ELEMENTOS
|--------------------------------------------------------------------------
*/

const btnLogin =
    document.getElementById("btnLogin");

const btnCadastro =
    document.getElementById("btnCadastro");

const btnLogout =
    document.getElementById("btnLogout");

const modalLogin =
    document.getElementById("modalLogin");

const modalCadastro =
    document.getElementById("modalCadastro");

const formLogin =
    document.getElementById("formLogin");

const formCadastro =
    document.getElementById("formCadastro");


/*
|--------------------------------------------------------------------------
| ABRIR MODAL
|--------------------------------------------------------------------------
*/

function abrirModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.add("ativo");
    }
}


/*
|--------------------------------------------------------------------------
| FECHAR MODAL
|--------------------------------------------------------------------------
*/

function fecharModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.remove("ativo");
    }
}


/*
|--------------------------------------------------------------------------
| BOTÃO LOGIN
|--------------------------------------------------------------------------
*/

btnLogin.addEventListener(
    "click",
    () => abrirModal("modalLogin")
);


/*
|--------------------------------------------------------------------------
| BOTÃO CADASTRO
|--------------------------------------------------------------------------
*/

btnCadastro.addEventListener(
    "click",
    () => abrirModal("modalCadastro")
);


/*
|--------------------------------------------------------------------------
| IR DO LOGIN PARA CADASTRO
|--------------------------------------------------------------------------
*/

document
    .getElementById("abrirCadastro")
    .addEventListener("click", () => {

        fecharModal("modalLogin");

        abrirModal("modalCadastro");
    });


/*
|--------------------------------------------------------------------------
| FECHAR MODAIS
|--------------------------------------------------------------------------
*/

document
    .querySelectorAll("[data-fechar]")
    .forEach(botao => {

        botao.addEventListener(
            "click",
            () => {

                fecharModal(
                    botao.dataset.fechar
                );
            }
        );
    });


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

formLogin.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();

        const login =
            document.getElementById("login").value;

        const senha =
            document.getElementById(
                "senhaLogin"
            ).value;


        const resultado = await api(
            "login",
            {
                method: "POST",

                body: {
                    login: login,
                    senha: senha
                }
            }
        );


        mostrarMensagem(
            resultado.mensagem,
            resultado.sucesso
        );


        if (resultado.sucesso) {

            fecharModal("modalLogin");

            formLogin.reset();

            await verificarSessao();

            carregarFeed();
        }

    }
);


/*
|--------------------------------------------------------------------------
| CADASTRO
|--------------------------------------------------------------------------
*/

formCadastro.addEventListener(
    "submit",
    async evento => {

        evento.preventDefault();

        const dados =
            new FormData(formCadastro);


        const resultado = await api(
            "cadastro",
            {
                method: "POST",
                body: dados
            }
        );


        mostrarMensagem(
            resultado.mensagem,
            resultado.sucesso
        );


        if (resultado.sucesso) {

            formCadastro.reset();

            fecharModal(
                "modalCadastro"
            );

            abrirModal("modalLogin");
        }

    }
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

btnLogout.addEventListener(
    "click",
    async () => {

        const resultado =
            await api("logout", {
                method: "POST"
            });


        mostrarMensagem(
            resultado.mensagem,
            resultado.sucesso
        );


        usuarioAtual = null;

        atualizarInterface();

        carregarFeed();
    }
);


/*
|--------------------------------------------------------------------------
| VERIFICAR SESSÃO
|--------------------------------------------------------------------------
*/

async function verificarSessao() {

    const resultado =
        await api("sessao");


    if (
        resultado.sucesso &&
        resultado.dados.logado
    ) {

        usuarioAtual =
            resultado.dados.usuario;

    } else {

        usuarioAtual = null;
    }


    atualizarInterface();
}


/*
|--------------------------------------------------------------------------
| ATUALIZAR INTERFACE
|--------------------------------------------------------------------------
*/

function atualizarInterface() {

    const areaUsuario =
        document.getElementById(
            "usuarioLogado"
        );

    const areaPublicacao =
        document.getElementById(
            "areaPublicacao"
        );


    if (usuarioAtual) {

        btnLogin.classList.add(
            "escondido"
        );

        btnCadastro.classList.add(
            "escondido"
        );

        btnLogout.classList.remove(
            "escondido"
        );

        areaPublicacao.classList.remove(
            "escondido"
        );


        areaUsuario.innerHTML = `
            <button
                class="usuario-header"
                onclick="abrirPerfil(${usuarioAtual.id_usuario})"
            >
                ${escapeHTML(usuarioAtual.nome)}
            </button>
        `;

    } else {

        btnLogin.classList.remove(
            "escondido"
        );

        btnCadastro.classList.remove(
            "escondido"
        );

        btnLogout.classList.add(
            "escondido"
        );

        areaPublicacao.classList.add(
            "escondido"
        );

        areaUsuario.innerHTML = "";
    }
}


/*
|--------------------------------------------------------------------------
| INICIAR AUTENTICAÇÃO
|--------------------------------------------------------------------------
*/

verificarSessao();