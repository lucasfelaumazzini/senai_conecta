<?php

/*
|--------------------------------------------------------------------------
| CONFIGURAÇÃO DO BANCO DE DADOS
|--------------------------------------------------------------------------
| Este arquivo faz a conexão entre o PHP e o MariaDB.
*/

// Configurações do XAMPP/MariaDB
$host = "localhost";
$dbname = "senai_conecta";
$user = "root";
$password = "";

// DSN da conexão
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

try {

    // Cria a conexão usando PDO
    $pdo = new PDO($dsn, $user, $password);

    // Faz o PDO mostrar erros como exceções
    $pdo->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    // Retorna os resultados como array associativo
    $pdo->setAttribute(
        PDO::ATTR_DEFAULT_FETCH_MODE,
        PDO::FETCH_ASSOC
    );

} catch (PDOException $e) {

    // Retorna erro em formato JSON
    http_response_code(500);

    header("Content-Type: application/json; charset=UTF-8");

    echo json_encode([
        "sucesso" => false,
        "mensagem" => "Erro ao conectar ao banco de dados."
    ]);

    exit;
}