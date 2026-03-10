// Script para rodar o projeto Menu Fácil Inteligente
// Escolha quais partes do monorepo iniciar
import { checkbox } from '@inquirer/prompts';
import { execSync } from 'child_process';
import concurrently from 'concurrently';
import chalk from 'chalk';

const services = [
    { 
        name: "Server (Express.js - API)", 
        command: "npm run start --prefix server", 
        color: "green", 
        tag: "API",
        port: 3000,
        url: "http://localhost:3000"
    },
    { 
        name: "Server (Nodemon - Desenvolvimento)", 
        command: "npm run dev --prefix server", 
        color: "cyan", 
        tag: "API-DEV",
        port: 3000,
        url: "http://localhost:3000"
    },
    { 
        name: "Web (Dashboard Admin - React)", 
        command: "npm run dev --prefix web", 
        color: "blue", 
        tag: "ADMIN",
        port: 5173,
        url: "http://localhost:5173"
    },
    { 
        name: "Mobile (App Cliente - React Native)", 
        command: "npm run start --prefix mobile", 
        color: "magenta", 
        tag: "APP",
        port: 8081,
        url: "http://localhost:8081"
    },
    { 
        name: "🌐 Abrir Navegador", 
        command: null, 
        color: "yellow", 
        tag: "BROWSER"
    }
];

const checkboxOptions = services.map(service => ({
    name: service.name,
    value: {
        command: service.command,
        prefixColor: service.color,
        name: service.tag
    }
}));

console.log(chalk.bold.cyan('\n🚀 Menu Fácil Inteligente - Inicializador de Serviços\n'));

const answer = await checkbox({
    message: "Quais serviços você deseja iniciar?",
    choices: checkboxOptions,
    required: true,
    loop: true,
});

// Evita iniciar Server e Server (Nodemon) simultaneamente
if (answer.some(s => s.name === 'API') && answer.some(s => s.name === 'API-DEV')) {
    answer = answer.filter(s => s.name !== 'API');
    console.log(chalk.yellow.bold('\n⚠️  Você escolheu iniciar o servidor com Nodemon. O comando "Server (Express.js)" será removido.\n'));
}

// Verifica se o usuário selecionou abrir navegador
const abrirNavegador = answer.some(s => s.name === 'BROWSER');

// Filtra apenas os serviços com comandos (remove o BROWSER que não tem comando)
const servicesParaExecutar = answer.filter(s => s.name !== 'BROWSER');

if (servicesParaExecutar.length === 0 && !abrirNavegador) {
    console.log(chalk.red.bold('Nenhum serviço foi selecionado. Abortando...'));
    process.exit(0);
}

if (servicesParaExecutar.length > 0) {
    console.log(chalk.bold.green('\n✅ Iniciando serviços...\n'));
    // Executa cada serviço em paralelo com concurrently
    const result = concurrently(servicesParaExecutar);
}

// Abre navegadores se selecionado
if (abrirNavegador) {
    const urlsParaAbrir = new Set();
    
    answer.forEach(service => {
        const serviceConfig = services.find(s => s.tag === service.name);
        if (serviceConfig && serviceConfig.url) {
            urlsParaAbrir.add(serviceConfig.url);
        }
    });
    
    if (urlsParaAbrir.size > 0) {
        // Aguarda um pouco para os serviços iniciarem antes de abrir o navegador
        setTimeout(() => {
            console.log(chalk.cyan('\n🌐 Abrindo navegador(es)...\n'));
            urlsParaAbrir.forEach(url => {
                try {
                    const platform = process.platform;
                    if (platform === 'win32') {
                        execSync(`start "" "${url}"`);
                    } else if (platform === 'darwin') {
                        execSync(`open "${url}"`);
                    } else {
                        execSync(`xdg-open "${url}"`);
                    }
                } catch (err) {
                    console.log(chalk.yellow(`⚠️  Não foi possível abrir o navegador automaticamente. Acesse: ${url}`));
                }
            });
        }, servicesParaExecutar.length > 0 ? 3000 : 0);
    }
}
