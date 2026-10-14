<?php

/*
|--------------------------------------------------------------------------
| CONTROLE DE SESSÃO
|--------------------------------------------------------------------------
*/

// Inicia a sessão somente se ela ainda não estiver iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


/*
|--------------------------------------------------------------------------
| VERIFICA SE O USUÁRIO ESTÁ LOGADO
|--------------------------------------------------------------------------
*/

function usuarioLogado()
{
    return isset($_SESSION["id_usuario"]);
}


/*
|--------------------------------------------------------------------------
| RETORNA O ID DO USUÁRIO LOGADO
|--------------------------------------------------------------------------
*/

function idUsuarioLogado()
{
    return $_SESSION["id_usuario"] ?? null;
}


/*
|--------------------------------------------------------------------------
| EXIGE LOGIN
|--------------------------------------------------------------------------
*/

function exigirLogin()
{
    if (!usuarioLogado()) {

        http_response_code(401);

        echo json_encode([
            "sucesso" => false,
            "mensagem" => "Você precisa estar logado."
        ]);

        exit;
    }
}


/*
|--------------------------------------------------------------------------
| RETORNA DADOS DO USUÁRIO DA SESSÃO
|--------------------------------------------------------------------------
*/

function dadosSessao()
{
    return [
        "id_usuario" => $_SESSION["id_usuario"] ?? null,
        "nome" => $_SESSION["nome"] ?? null,
        "username" => $_SESSION["username"] ?? null
    ];
}