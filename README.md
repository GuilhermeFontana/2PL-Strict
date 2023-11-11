# 2PL-Strict

Este projeto foi realizado para a cadeira: **_CIC7100H - Banco de Dados_** do cursor de **_[Ciência da Computação, na UCS](https://www.ucs.br/ciencias-da-computacao)_**, semestre 2023/4

## ⚙ Orientação

Implementação de um simulador de escalonador de transações 2PL Strict para um SGBD multiusuário

Objetivo: implementar, de forma simulada, um escalonador de transações que utilize o protocolo 2PL Strict.

### Funcionamento geral da implementação:

**Entrada de dados**: uma história de execução de transações com operações entrelaçadas, ou transações cujo entrelaçamento será gerado pelo programa. A história inicial de execução (HI), ou as transações a serem executadas podem ou serem informadas (podem ser digitadas suas operações em sequência, ou lidas de um arquivo, ou definidas dentro do programa) ou serem escolhidas entre algumas pré-definidas. Cada transação tem um identificador, e possui start, commit e operações de leitura (r) e/ou escrita (w) de dados.

Como é uma simulação, os dados escritos/lidos pelas transações (banco de dados) são representados por variáveis do programa. No início do programa, cada dado tem um valor inicial atribuído pelo programa.

O programa mantém uma tabela de locks, que vai permitir manter e controlar o acesso aos dados para leitura/escrita, através dos bloqueios e desbloqueios (locks e unlocks) compartilhados e exclusivos sobre cada dado.

**Execução**: para iniciar a execução. o simulador ou gera uma possível sequência de execução com operações entrelaçadas, a história inicial de execução (HI), ou já utiliza uma HI pré-definida. Na sequência, essas operações da HI vão sendo enviadas ao escalonador que controla a execução, na ordem em que estão na HI, e o escalonador vai verificando se podem ser executadas nessa sequência ou não:

- para cada operação, verifica se o lock correspondente à operação pode ser concedido; se puder concede o lock e coloca a operação na história final de execução (HF); se não puder, coloca a operação em delay (e por consequência as demais operações da mesma transação também ficam em delay) e passa para a próxima operação prevista na HI. Antes de verificar cada nova operação prevista na HI, verifica se as operações em delay poder ser executadas (se puderem, executa).

Quando uma operação pode ser executada, ela é colocada na HF.

No final, a sequência de operações executadas está na HF (a ordem das operações das transações na HF pode ser diferente da ordem em que elas foram fornecidas na HI).

### Observações:

- É importante ir mostrando na tela a execução passo a passo (a sequência de operações da HF): locks concedidos e retirados, poder visualizar a HI e a HF (para fins de comparação)

- Quando o protocolo utilizar locks (e unlocks): eles devem ser apresentados na HF (e os delays de operações controlados). A HI não tem locks, pois eles são colocados pelo escalonador;

- Quando houver deadlocks: eles devem ser sinalizados (mostrar na tela), e o escalonador deve ter um critério para tratá-los (definir um critério e utilizá-lo para tratar);

- Quando houver abort de transações (em caso de deadlock, por exemplo): as operações de cada transação abortada devem ser retiradas da HF, e essas transações devem ser colocadas novamente em execução pelo simulador.

## 🚔 Regras de Negócio

- Deadlock

Quando uma transação requisita um dado que esta bloquado por outra transação ela é bloqueada e abortada.

- Abort

Quando uma transação é abortada ela é executa após as demais finalizarem, seja por commit ou por abort.

De meira alguma a transação abortada será retomada durante a execução atual da história, mesmo que os dados necessários sejam liberdas.

Se 2 ou mais transações forem abortadas, todas suas intruções serão executadas juntas ao final, na hordem em que se encontram na história inicial, desconsiderando as instruções de transações finalizadas.

- Execução

São executadas todas as instruções, até que não exista nenhuma transação pendente, na ordem em que vieram na história inicial. Seguindo a regra de deadlocks e aborts.

- Bloqueios

Quando uma transação requisita um dado, o mesmo fica bloquado para a mesma.

Se a solicitação for de leitura, o dado sofrerá um bloqueio compartilhado e outras transações poderão ler o mesmo, mas não escrever. Já se for de escrita, o mesmo sofrerá um bloquio exclusivo e nenhuma outra transação poderá interagir com o ele.

Caso a instrução atual for uma escrita, em um dado que esteja bloqueado de maneira compatilhada somente para a transação vigente, este bloqueio sofrerá um _upgrade_ e ficará exclusivo. Entretanto, se o bloqueio contemplar outra(s) transação (ões), a atual sofrerá um deadlock.

- Liberações

Os bloqueios só são liberados após a finalização (commit) da transação que os bloqueia.

As liberação vão ocorrer sob demanda, no momento em que uma outra transação solicitar o dado disponível para ser liberado. Se isto não ocorrer, todas as liberações serão realizadas após a execução atual da história.

## Estruturas

### 📄 Arquivo de entradas ( _historys.json_ ):

```
[
    {
        "name": String,
        "instructions": [
            { < Instrução de entrada > }
        ]
    }
]
```

#### Instruções de entrada:

🔎 Leitura de dados

```
{
    "type": "R",
    "data": Char,
    "transaction": Number
}
```

🔎 Escrita de dados

```
{
    "type": "W",
    "data": Char,
    "transaction": Number,
    "value": Number
}
```

🔎 Commit da trasação

```
{
    "type": "C",
    "transaction": Number
}
```

---

### 📫 História de saida

```
[
    { < Instrução de saída > }
]
```

#### Instruções de saída:

🔎 Leitura e escrita de dados

```
/**
*
* "R": Leitura
* "W": Escrita
*
**/

{
    "type": "R"/"W",
    "data": Char,
    "transaction": Number,
    "value": Number
}
```

🔎 Commit da trasação

```
{
    "type": "C",
    "transaction": Number
}
```

🔎 Bloqueio e desbloqueio de dados

```
/**
*
* "LE": Bloqueio esclusívo
* "LS": Bloqueio compartilhado
* "UE": Desbloqueio esclusívo
* "US": Desbloqueio compartilhado
*
**/

{
    "type": "LS"/"LE"/"US"/"UE",
    "data": Char,
    "transaction": Number,
}
```

---

### Outras Estruturas

📌 Tabela de bloqueios:

```
{
    "data": Char,
    "type": null/"E"/"S",
    "transactions": [Number]
}
```

📌 Tabela de dados:

```
{
    "name": Char,
    "value": Number,
    history: [
        {
            "newValue": Number,
            "transaction": Number
        }
    ]
}
```

📌 Tabela de transações:

```
{
    name: Char,
    commited: Boolean,
    blocked: {
        status: Boolean,
        transactions: [Number]
    }
}
```

## 💻 Tecnologias

<p align="left" direction="row">
    <a href="https://developer.mozilla.org/pt-BR/docs/Web/JavaScript" target="_blank" rel="noreferrer"> 
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/JavaScript-logo.png/800px-JavaScript-logo.png" alt="js-logo" width="50" height="50"/> 
    </a >
    <a href="https://nodejs.org/en" target="_blank" rel="noreferrer"> 
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/2560px-Node.js_logo.svg.png" alt="Python Arcade" width="75" height="50"/> 
    </a>
</p>
