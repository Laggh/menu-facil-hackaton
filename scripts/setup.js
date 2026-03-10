// Script para listar comandos de setup do projeto Menu Fácil Inteligente
import { checkbox } from '@inquirer/prompts';
import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tasks = [
    {
        name: "Instalar dependências da raiz",
        command: "npm install",
        skipable: false
    },
    {
        name: "Instalar dependências do Web (Dashboard)",
        command: "cd web && npm install && cd ..",
        skipable: true
    },
    {
        name: "Instalar dependências do Server (API)",
        command: "cd server && npm install && cd ..",
        skipable: true
    },
    {
        name: "Instalar dependências do Mobile (App)",
        command: "cd mobile && npm install && cd ..",
        skipable: true
    }
];

const taskOptions = tasks.map((task) => ({
    name: task.name,
    value: task,
    checked: !task.skipable
}));

console.log(chalk.bold.cyan('\n🍔 Menu Fácil - Setup do Projeto\n'));

const selectedTasks = await checkbox({
    message: "Quais tarefas de setup você deseja rodar?",
    choices: taskOptions,
    required: true,
    loop: true,
});

console.log(chalk.bold.cyan('\n📋 Executando tarefas...\n'));

selectedTasks.forEach((task, index) => {
    console.log(chalk.yellow(`${index + 1}. ${task.name}`));
    console.log(chalk.white(`   $ ${task.command}\n`));
    
    try {
        execSync(task.command, {
            stdio: 'inherit',
            shell: true
        });
        console.log(chalk.green(`✅ ${task.name} concluída!\n`));
    } catch (err) {
        console.error(chalk.red(`❌ Erro ao executar: ${task.name}\n`));
        process.exit(1);
    }
});

console.log(chalk.cyan.bold('✨ Setup completo!\n'));

// Copia o .env da raiz para server e web
console.log(chalk.bold.cyan('📋 Copiando arquivo .env para pastas...\n'));

try {
    const rootEnvPath = path.join(__dirname, '..', '.env');
    const serverEnvPath = path.join(__dirname, '..', 'server', '.env');
    const webEnvPath = path.join(__dirname, '..', 'web', '.env');

    if (fs.existsSync(rootEnvPath)) {
        const envContent = fs.readFileSync(rootEnvPath, 'utf-8');
        
        // Copia para server
        fs.writeFileSync(serverEnvPath, envContent);
        console.log(chalk.green(`✅ .env copiado para server`));
        
        // Copia para web
        fs.writeFileSync(webEnvPath, envContent);
        console.log(chalk.green(`✅ .env copiado para web\n`));
    } else {
        console.log(chalk.yellow(`⚠️  Arquivo .env não encontrado na raiz\n`));
    }
} catch (err) {
    console.error(chalk.red(`❌ Erro ao copiar .env: ${err.message}\n`));
}
