// Script para listar comandos de setup do projeto Menu Fácil Inteligente
import { checkbox } from '@inquirer/prompts';
import { execSync } from 'child_process';
import chalk from 'chalk';

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
