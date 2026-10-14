<?php

/*
|--------------------------------------------------------------------------
| SENAI CONECTA - API PRINCIPAL
|--------------------------------------------------------------------------
*/

header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set("America/Sao_Paulo");

require_once __DIR__ . "/config/database.php";
require_once __DIR__ . "/helpers/jwt_helper.php";


/*
|--------------------------------------------------------------------------
| FUNÇÃO PARA RETORNAR JSON
|--------------------------------------------------------------------------
*/

function resposta($sucesso, $mensagem, $dados = [])
{
    echo json_encode([
        "sucesso" => $sucesso,
        "mensagem" => $mensagem,
        "dados" => $dados
    ]);

    exit;
}


/*
|--------------------------------------------------------------------------
| LÊ JSON ENVIADO PELO JAVASCRIPT
|--------------------------------------------------------------------------
*/

function lerJSON()
{
    $entrada = file_get_contents("php://input");

    if (!$entrada) {
        return [];
    }

    $dados = json_decode($entrada, true);

    return is_array($dados) ? $dados : [];
}


/*
|--------------------------------------------------------------------------
| SALVAR IMAGEM
|--------------------------------------------------------------------------
*/

function salvarImagem($arquivo)
{
    if (
        !isset($arquivo) ||
        $arquivo["error"] === UPLOAD_ERR_NO_FILE
    ) {
        return null;
    }

    if ($arquivo["error"] !== UPLOAD_ERR_OK) {
        resposta(false, "Erro ao enviar a imagem.");
    }

    // Limite de 5 MB
    if ($arquivo["size"] > 5 * 1024 * 1024) {
        resposta(false, "A imagem deve ter no máximo 5 MB.");
    }

    // Detecta o tipo real do arquivo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);

    $tipo = finfo_file(
        $finfo,
        $arquivo["tmp_name"]
    );

    finfo_close($finfo);

    $tiposPermitidos = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp"
    ];

    if (!isset($tiposPermitidos[$tipo])) {
        resposta(
            false,
            "Formato de imagem não permitido."
        );
    }

    // Nome único
    $nomeArquivo =
        bin2hex(random_bytes(10))
        . "."
        . $tiposPermitidos[$tipo];

    $pasta = __DIR__ . "/uploads/";

    // Cria a pasta se ela não existir
    if (!is_dir($pasta)) {
        mkdir($pasta, 0777, true);
    }

    $destino = $pasta . $nomeArquivo;

    if (!move_uploaded_file(
        $arquivo["tmp_name"],
        $destino
    )) {
        resposta(
            false,
            "Não foi possível salvar a imagem."
        );
    }

    return $nomeArquivo;
}


/*
|--------------------------------------------------------------------------
| AÇÃO SOLICITADA
|--------------------------------------------------------------------------
*/

$acao = $_GET["acao"] ?? "";


/*
|--------------------------------------------------------------------------
| CADASTRO
|--------------------------------------------------------------------------
*/

if ($acao === "cadastro") {

    $nome = trim($_POST["nome"] ?? "");
    $username = trim($_POST["username"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $senha = $_POST["senha"] ?? "";
    $tipoPerfil = $_POST["tipo_perfil"] ?? "aluno";

    if (
        $nome === "" ||
        $username === "" ||
        $email === "" ||
        $senha === ""
    ) {
        resposta(
            false,
            "Preencha todos os campos obrigatórios."
        );
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        resposta(false, "Digite um e-mail válido.");
    }

    if (strlen($senha) < 6) {
        resposta(
            false,
            "A senha deve ter pelo menos 6 caracteres."
        );
    }

    $tiposValidos = [
        "aluno",
        "professor",
        "administrador"
    ];

    if (!in_array($tipoPerfil, $tiposValidos)) {
        $tipoPerfil = "aluno";
    }

    // Verifica se username ou e-mail já existem
    $consulta = $pdo->prepare("
        SELECT id_usuario
        FROM usuario
        WHERE username = ?
        OR email = ?
    ");

    $consulta->execute([
        $username,
        $email
    ]);

    if ($consulta->fetch()) {
        resposta(
            false,
            "Username ou e-mail já cadastrado."
        );
    }

    // Salva a foto
    $foto = salvarImagem(
        $_FILES["foto"] ?? null
    );

    // Protege a senha
    $senhaHash = password_hash(
        $senha,
        PASSWORD_DEFAULT
    );

    try {

        $sql = "
            INSERT INTO usuario
            (
                nome,
                username,
                email,
                senha,
                foto,
                tipo_perfil
            )
            VALUES (?, ?, ?, ?, ?, ?)
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            $nome,
            $username,
            $email,
            $senhaHash,
            $foto,
            $tipoPerfil
        ]);

        resposta(
            true,
            "Cadastro realizado com sucesso!"
        );

    } catch (PDOException $e) {

        resposta(
            false,
            "Erro ao realizar cadastro."
        );
    }
}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

if ($acao === "login") {

    $dados = lerJSON();

    $login = trim($dados["login"] ?? "");
    $senha = $dados["senha"] ?? "";

    if ($login === "" || $senha === "") {
        resposta(
            false,
            "Digite seu login e sua senha."
        );
    }

    $stmt = $pdo->prepare("
        SELECT *
        FROM usuario
        WHERE email = ?
        OR username = ?
        LIMIT 1
    ");

    $stmt->execute([
        $login,
        $login
    ]);

    $usuario = $stmt->fetch();

    if (
        !$usuario ||
        !password_verify(
            $senha,
            $usuario["senha"]
        )
    ) {
        resposta(
            false,
            "Login ou senha incorretos."
        );
    }

    // Evita fixação de sessão
    session_regenerate_id(true);

    $_SESSION["id_usuario"] =
        $usuario["id_usuario"];

    $_SESSION["nome"] =
        $usuario["nome"];

    $_SESSION["username"] =
        $usuario["username"];

    resposta(
        true,
        "Login realizado com sucesso!",
        [
            "usuario" => [
                "id_usuario" =>
                    $usuario["id_usuario"],

                "nome" =>
                    $usuario["nome"],

                "username" =>
                    $usuario["username"],

                "foto" =>
                    $usuario["foto"],

                "tipo_perfil" =>
                    $usuario["tipo_perfil"]
            ]
        ]
    );
}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

if ($acao === "logout") {

    $_SESSION = [];

    if (ini_get("session.use_cookies")) {

        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            "",
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();

    resposta(
        true,
        "Logout realizado com sucesso."
    );
}


/*
|--------------------------------------------------------------------------
| VERIFICAR SESSÃO
|--------------------------------------------------------------------------
*/

if ($acao === "sessao") {

    if (!usuarioLogado()) {

        resposta(
            true,
            "Nenhum usuário logado.",
            [
                "logado" => false
            ]
        );
    }

    $stmt = $pdo->prepare("
        SELECT
            id_usuario,
            nome,
            username,
            email,
            foto,
            tipo_perfil
        FROM usuario
        WHERE id_usuario = ?
    ");

    $stmt->execute([
        idUsuarioLogado()
    ]);

    $usuario = $stmt->fetch();

    resposta(
        true,
        "Sessão encontrada.",
        [
            "logado" => true,
            "usuario" => $usuario
        ]
    );
}


/*
|--------------------------------------------------------------------------
| CRIAR PUBLICAÇÃO
|--------------------------------------------------------------------------
*/

if ($acao === "publicar") {

    exigirLogin();

    $texto = trim($_POST["texto"] ?? "");

    $imagem = salvarImagem(
        $_FILES["imagem"] ?? null
    );

    if ($texto === "" && $imagem === null) {

        resposta(
            false,
            "Digite um texto ou envie uma imagem."
        );
    }

    $stmt = $pdo->prepare("
        INSERT INTO publicacao
        (
            id_usuario,
            texto,
            imagem
        )
        VALUES (?, ?, ?)
    ");

    $stmt->execute([
        idUsuarioLogado(),
        $texto !== "" ? $texto : null,
        $imagem
    ]);

    resposta(
        true,
        "Publicação criada com sucesso!"
    );
}


/*
|--------------------------------------------------------------------------
| FEED
|--------------------------------------------------------------------------
*/

if ($acao === "feed") {

    $idUsuario = idUsuarioLogado();

    $sql = "
        SELECT
            p.id_publicacao,
            p.id_usuario,
            p.texto,
            p.imagem,
            p.datahora_publicacao,

            u.nome,
            u.username,
            u.foto,

            COUNT(DISTINCT c.id_curtidas)
            AS quantidade_curtidas,

            MAX(
                CASE
                    WHEN c.id_usuario = ?
                    THEN 1
                    ELSE 0
                END
            ) AS usuario_curtiu

        FROM publicacao p

        INNER JOIN usuario u
            ON u.id_usuario = p.id_usuario

        LEFT JOIN curtida c
            ON c.id_publicacao =
               p.id_publicacao

        GROUP BY
            p.id_publicacao,
            p.id_usuario,
            p.texto,
            p.imagem,
            p.datahora_publicacao,
            u.nome,
            u.username,
            u.foto

        ORDER BY
            p.datahora_publicacao DESC
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        $idUsuario ?? 0
    ]);

    $publicacoes = $stmt->fetchAll();

    resposta(
        true,
        "Feed carregado.",
        [
            "publicacoes" => $publicacoes
        ]
    );
}


/*
|--------------------------------------------------------------------------
| CURTIR / DESCURTIR
|--------------------------------------------------------------------------
*/

if ($acao === "curtir") {

    exigirLogin();

    $dados = lerJSON();

    $idPublicacao =
        intval($dados["id_publicacao"] ?? 0);

    if ($idPublicacao <= 0) {
        resposta(
            false,
            "Publicação inválida."
        );
    }

    // Verifica se já curtiu
    $stmt = $pdo->prepare("
        SELECT id_curtidas
        FROM curtida
        WHERE id_publicacao = ?
        AND id_usuario = ?
    ");

    $stmt->execute([
        $idPublicacao,
        idUsuarioLogado()
    ]);

    $curtida = $stmt->fetch();

    if ($curtida) {

        // Retira a curtida
        $stmt = $pdo->prepare("
            DELETE FROM curtida
            WHERE id_curtidas = ?
        ");

        $stmt->execute([
            $curtida["id_curtidas"]
        ]);

        resposta(
            true,
            "Curtida removida.",
            [
                "curtiu" => false
            ]
        );

    } else {

        // Adiciona a curtida
        $stmt = $pdo->prepare("
            INSERT INTO curtida
            (
                id_publicacao,
                id_usuario
            )
            VALUES (?, ?)
        ");

        $stmt->execute([
            $idPublicacao,
            idUsuarioLogado()
        ]);

        resposta(
            true,
            "Publicação curtida!",
            [
                "curtiu" => true
            ]
        );
    }
}


/*
|--------------------------------------------------------------------------
| EXCLUIR PUBLICAÇÃO
|--------------------------------------------------------------------------
*/

if ($acao === "excluir_publicacao") {

    exigirLogin();

    $dados = lerJSON();

    $idPublicacao =
        intval($dados["id_publicacao"] ?? 0);

    // Só permite excluir publicação própria
    $stmt = $pdo->prepare("
        SELECT imagem
        FROM publicacao
        WHERE id_publicacao = ?
        AND id_usuario = ?
    ");

    $stmt->execute([
        $idPublicacao,
        idUsuarioLogado()
    ]);

    $publicacao = $stmt->fetch();

    if (!$publicacao) {

        resposta(
            false,
            "Você não pode excluir esta publicação."
        );
    }

    // Exclui do banco
    $stmt = $pdo->prepare("
        DELETE FROM publicacao
        WHERE id_publicacao = ?
        AND id_usuario = ?
    ");

    $stmt->execute([
        $idPublicacao,
        idUsuarioLogado()
    ]);

    // Exclui imagem do servidor
    if (!empty($publicacao["imagem"])) {

        $arquivo =
            __DIR__
            . "/uploads/"
            . $publicacao["imagem"];

        if (file_exists($arquivo)) {
            unlink($arquivo);
        }
    }

    resposta(
        true,
        "Publicação excluída."
    );
}


/*
|--------------------------------------------------------------------------
| PESQUISAR USUÁRIOS
|--------------------------------------------------------------------------
*/

if ($acao === "pesquisar") {

    $termo =
        trim($_GET["termo"] ?? "");

    if ($termo === "") {

        resposta(
            true,
            "Digite algo para pesquisar.",
            [
                "usuarios" => []
            ]
        );
    }

    $busca = "%" . $termo . "%";

    $stmt = $pdo->prepare("
        SELECT
            id_usuario,
            nome,
            username,
            foto,
            tipo_perfil
        FROM usuario
        WHERE nome LIKE ?
        OR username LIKE ?
        ORDER BY nome ASC
        LIMIT 30
    ");

    $stmt->execute([
        $busca,
        $busca
    ]);

    resposta(
        true,
        "Pesquisa realizada.",
        [
            "usuarios" => $stmt->fetchAll()
        ]
    );
}


/*
|--------------------------------------------------------------------------
| PERFIL DE USUÁRIO
|--------------------------------------------------------------------------
*/

if ($acao === "perfil") {

    $idUsuario =
        intval($_GET["id_usuario"] ?? 0);

    if ($idUsuario <= 0) {

        resposta(
            false,
            "Usuário inválido."
        );
    }

    // Dados do usuário
    $stmt = $pdo->prepare("
        SELECT
            id_usuario,
            nome,
            username,
            email,
            foto,
            tipo_perfil,
            criado_em
        FROM usuario
        WHERE id_usuario = ?
    ");

    $stmt->execute([
        $idUsuario
    ]);

    $usuario = $stmt->fetch();

    if (!$usuario) {

        resposta(
            false,
            "Usuário não encontrado."
        );
    }

    // Publicações
    $stmt = $pdo->prepare("
        SELECT
            p.id_publicacao,
            p.texto,
            p.imagem,
            p.datahora_publicacao,
            COUNT(c.id_curtidas)
            AS quantidade_curtidas
        FROM publicacao p
        LEFT JOIN curtida c
            ON c.id_publicacao =
               p.id_publicacao
        WHERE p.id_usuario = ?
        GROUP BY
            p.id_publicacao
        ORDER BY
            p.datahora_publicacao DESC
    ");

    $stmt->execute([
        $idUsuario
    ]);

    $publicacoes = $stmt->fetchAll();

    resposta(
        true,
        "Perfil carregado.",
        [
            "usuario" => $usuario,
            "publicacoes" => $publicacoes
        ]
    );
}


/*
|--------------------------------------------------------------------------
| AÇÃO INVÁLIDA
|--------------------------------------------------------------------------
*/

resposta(
    false,
    "Ação não encontrada."
);