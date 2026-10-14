/*
|--------------------------------------------------------------------------
| APLICAÇÃO PRINCIPAL
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| MENSAGENS
|--------------------------------------------------------------------------
*/

function mostrarMensagem(
    texto,
    sucesso = true
) {

    const elemento =
        document.getElementById(
            "mensagem"
        );

    elemento.textContent = texto;

    elemento.className =
        sucesso
            ? "mensagem sucesso"
            : "mensagem erro";


    setTimeout(() => {

        elemento.className =
            "mensagem";

    }, 3500);
}


/*
|--------------------------------------------------------------------------
| ESCAPAR HTML
|--------------------------------------------------------------------------
| Evita que texto digitado por usuários
| seja interpretado como HTML.
|--------------------------------------------------------------------------
*/

function escapeHTML(texto) {

    if (texto === null ||
        texto === undefined) {

        return "";
    }

    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/*
|--------------------------------------------------------------------------
| URL DAS IMAGENS
|--------------------------------------------------------------------------
*/

function imagemUrl(nome) {

    if (!nome) {
        return "";
    }

    return "../backend/uploads/"
        + encodeURIComponent(nome);
}


/*
|--------------------------------------------------------------------------
| CARREGAR FEED
|--------------------------------------------------------------------------
*/

async function carregarFeed() {

    const area =
        document.getElementById(
            "feedPublicacoes"
        );


    area.innerHTML = `
        <div class="carregando">
            Carregando publicações...
        </div>
    `;


    const resultado =
        await api("feed");


    if (!resultado.sucesso) {

        area.innerHTML = `
            <p class="vazio">
                Não foi possível carregar o feed.
            </p>
        `;

        return;
    }


    const publicacoes =
        resultado.dados.publicacoes;


    if (publicacoes.length === 0) {

        area.innerHTML = `
            <div class="vazio">
                <h3>Nenhuma publicação ainda.</h3>
                <p>
                    Seja o primeiro a publicar!
                </p>
            </div>
        `;

        return;
    }


    area.innerHTML =
        publicacoes
            .map(criarCardPublicacao)
            .join("");
}


/*
|--------------------------------------------------------------------------
| CRIAR CARD DE PUBLICAÇÃO
|--------------------------------------------------------------------------
*/

function criarCardPublicacao(publicacao) {

    const imagem =
        publicacao.imagem
            ? `
                <img
                    class="imagem-publicacao"
                    src="${imagemUrl(
                        publicacao.imagem
                    )}"
                    alt="Imagem da publicação"
                >
            `
            : "";


    const foto =
        publicacao.foto
            ? `
                <img
                    class="avatar"
                    src="${imagemUrl(
                        publicacao.foto
                    )}"
                    alt="Foto de perfil"
                >
            `
            : `
                <div class="avatar sem-foto">
                    👤
                </div>
            `;


    const souDono =
        usuarioAtual &&
        Number(usuarioAtual.id_usuario)
        === Number(publicacao.id_usuario);


    const botaoExcluir =
        souDono
            ? `
                <button
                    class="btn-excluir"
                    onclick="abrirConfirmacaoExclusao(
                        ${publicacao.id_publicacao}
                    )"
                >
                    🗑️
                </button>
            `
            : "";


    const curtiu =
        Number(publicacao.usuario_curtiu)
        === 1;


    return `
        <article
            class="card publicacao"
        >

            <div class="cabecalho-publicacao">

                <button
                    class="autor"
                    onclick="abrirPerfil(
                        ${publicacao.id_usuario}
                    )"
                >

                    ${foto}

                    <span>
                        <strong>
                            ${escapeHTML(
                                publicacao.nome
                            )}
                        </strong>

                        <small>
                            @${escapeHTML(
                                publicacao.username
                            )}
                        </small>
                    </span>

                </button>

                ${botaoExcluir}

            </div>


            ${
                publicacao.texto
                    ? `
                        <p class="texto-publicacao">
                            ${escapeHTML(
                                publicacao.texto
                            ).replaceAll(
                                "\n",
                                "<br>"
                            )}
                        </p>
                    `
                    : ""
            }


            ${imagem}


            <div class="rodape-publicacao">

                <button
                    class="btn-curtir ${
                        curtiu
                            ? "curtido"
                            : ""
                    }"
                    onclick="curtir(
                        ${publicacao.id_publicacao}
                    )"
                >

                    ${
                        curtiu
                            ? "❤️"
                            : "🤍"
                    }

                    ${publicacao.quantidade_curtidas}
                </button>

                <span>
                    ${formatarData(
                        publicacao.datahora_publicacao
                    )}
                </span>

            </div>

        </article>
    `;
}


/*
|--------------------------------------------------------------------------
| CURTIR
|--------------------------------------------------------------------------
*/

async function curtir(idPublicacao) {

    if (!usuarioAtual) {

        abrirModal("modalLogin");

        mostrarMensagem(
            "Faça login para curtir.",
            false
        );

        return;
    }


    const resultado =
        await api(
            "curtir",
            {
                method: "POST",

                body: {
                    id_publicacao:
                        idPublicacao
                }
            }
        );


    mostrarMensagem(
        resultado.mensagem,
        resultado.sucesso
    );


    if (resultado.sucesso) {
        carregarFeed();
    }
}


/*
|--------------------------------------------------------------------------
| FORMULÁRIO DE PUBLICAÇÃO
|--------------------------------------------------------------------------
*/

document
    .getElementById("formPublicacao")
    .addEventListener(
        "submit",
        async evento => {

            evento.preventDefault();


            if (!usuarioAtual) {

                abrirModal("modalLogin");

                return;
            }


            const form =
                document.getElementById(
                    "formPublicacao"
                );


            const dados =
                new FormData(form);


            const resultado =
                await api(
                    "publicar",
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

                form.reset();

                document
                    .getElementById(
                        "previewImagem"
                    )
                    .innerHTML = "";

                carregarFeed();
            }

        }
    );


/*
|--------------------------------------------------------------------------
| PREVIEW DA IMAGEM
|--------------------------------------------------------------------------
*/

document
    .getElementById("imagemPublicacao")
    .addEventListener(
        "change",
        evento => {

            const arquivo =
                evento.target.files[0];

            const preview =
                document.getElementById(
                    "previewImagem"
                );


            if (!arquivo) {

                preview.innerHTML = "";

                return;
            }


            const url =
                URL.createObjectURL(
                    arquivo
                );


            preview.innerHTML = `
                <img
                    class="preview"
                    src="${url}"
                    alt="Pré-visualização"
                >
            `;
        }
    );


/*
|--------------------------------------------------------------------------
| PESQUISA DE USUÁRIOS
|--------------------------------------------------------------------------
*/

document
    .getElementById("btnPesquisar")
    .addEventListener(
        "click",
        pesquisarUsuarios
    );


document
    .getElementById("campoPesquisa")
    .addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Enter") {
                pesquisarUsuarios();
            }
        }
    );


async function pesquisarUsuarios() {

    const termo =
        document.getElementById(
            "campoPesquisa"
        ).value.trim();


    const resultado =
        document.getElementById(
            "resultadoPesquisa"
        );


    if (!termo) {

        resultado.innerHTML = "";

        return;
    }


    const resposta =
        await api(
            `pesquisar&termo=${encodeURIComponent(
                termo
            )}`
        );


    if (!resposta.sucesso) {

        resultado.innerHTML = `
            <p>
                Erro ao pesquisar usuários.
            </p>
        `;

        return;
    }


    const usuarios =
        resposta.dados.usuarios;


    if (usuarios.length === 0) {

        resultado.innerHTML = `
            <div class="card">
                Nenhum usuário encontrado.
            </div>
        `;

        return;
    }


    resultado.innerHTML = usuarios
        .map(usuario => {

            const foto =
                usuario.foto
                    ? `
                        <img
                            class="avatar"
                            src="${imagemUrl(
                                usuario.foto
                            )}"
                        >
                    `
                    : `
                        <div class="avatar sem-foto">
                            👤
                        </div>
                    `;


            return `
                <button
                    class="resultado-usuario"
                    onclick="abrirPerfil(
                        ${usuario.id_usuario}
                    )"
                >

                    ${foto}

                    <span>

                        <strong>
                            ${escapeHTML(
                                usuario.nome
                            )}
                        </strong>

                        <small>
                            @${escapeHTML(
                                usuario.username
                            )}
                        </small>

                    </span>

                </button>
            `;

        })
        .join("");
}


/*
|--------------------------------------------------------------------------
| ABRIR PERFIL
|--------------------------------------------------------------------------
*/

async function abrirPerfil(idUsuario) {

    const resultado =
        await api(
            `perfil&id_usuario=${idUsuario}`
        );


    if (!resultado.sucesso) {

        mostrarMensagem(
            resultado.mensagem,
            false
        );

        return;
    }


    const usuario =
        resultado.dados.usuario;

    const publicacoes =
        resultado.dados.publicacoes;


    const foto =
        usuario.foto
            ? `
                <img
                    class="perfil-foto"
                    src="${imagemUrl(
                        usuario.foto
                    )}"
                >
            `
            : `
                <div class="perfil-foto sem-foto">
                    👤
                </div>
            `;


    const publicacoesHTML =
        publicacoes.length > 0
            ? publicacoes
                .map(publicacao => {

                    const imagem =
                        publicacao.imagem
                            ? `
                                <img
                                    class="imagem-publicacao"
                                    src="${imagemUrl(
                                        publicacao.imagem
                                    )}"
                                >
                            `
                            : "";


                    return `
                        <div class="perfil-publicacao">

                            ${
                                publicacao.texto
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                publicacao.texto
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                            ${imagem}

                            <small>
                                ❤️
                                ${publicacao.quantidade_curtidas}
                                ·
                                ${formatarData(
                                    publicacao.datahora_publicacao
                                )}
                            </small>

                        </div>
                    `;

                })
                .join("")
            : `
                <p>
                    Este usuário ainda não publicou nada.
                </p>
            `;


    document
        .getElementById("conteudoPerfil")
        .innerHTML = `

            <div class="perfil-cabecalho">

                ${foto}

                <div>

                    <h2>
                        ${escapeHTML(
                            usuario.nome
                        )}
                    </h2>

                    <p>
                        @${escapeHTML(
                            usuario.username
                        )}
                    </p>

                    <span class="badge">
                        ${escapeHTML(
                            usuario.tipo_perfil
                        )}
                    </span>

                </div>

            </div>


            <hr>

            <h3>Publicações</h3>

            <div class="perfil-lista">
                ${publicacoesHTML}
            </div>
        `;


    abrirModal("modalPerfil");
}


/*
|--------------------------------------------------------------------------
| CONFIRMAÇÃO DE EXCLUSÃO
|--------------------------------------------------------------------------
*/

let publicacaoParaExcluir = null;


function abrirConfirmacaoExclusao(
    idPublicacao
) {

    publicacaoParaExcluir =
        idPublicacao;

    abrirModal("modalExcluir");
}


document
    .getElementById("cancelarExclusao")
    .addEventListener(
        "click",
        () => {

            publicacaoParaExcluir = null;

            fecharModal(
                "modalExcluir"
            );
        }
    );


document
    .getElementById("confirmarExclusao")
    .addEventListener(
        "click",
        async () => {

            if (!publicacaoParaExcluir) {
                return;
            }


            const resultado =
                await api(
                    "excluir_publicacao",
                    {
                        method: "POST",

                        body: {
                            id_publicacao:
                                publicacaoParaExcluir
                        }
                    }
                );


            mostrarMensagem(
                resultado.mensagem,
                resultado.sucesso
            );


            fecharModal(
                "modalExcluir"
            );


            publicacaoParaExcluir = null;


            if (resultado.sucesso) {
                carregarFeed();
            }
        }
    );


/*
|--------------------------------------------------------------------------
| FORMATAR DATA
|--------------------------------------------------------------------------
*/

function formatarData(data) {

    if (!data) {
        return "";
    }

    const dataObj =
        new Date(
            data.replace(" ", "T")
        );


    if (isNaN(dataObj.getTime())) {
        return data;
    }


    return dataObj.toLocaleString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/*
|--------------------------------------------------------------------------
| FECHAR MODAL CLICANDO FORA
|--------------------------------------------------------------------------
*/

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            evento => {

                if (
                    evento.target === modal
                ) {

                    modal.classList.remove(
                        "ativo"
                    );
                }
            }
        );
    });


/*
|--------------------------------------------------------------------------
| CARREGAR FEED AO ABRIR O SITE
|--------------------------------------------------------------------------
*/

carregarFeed();