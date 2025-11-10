import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
}

class Logger {
  private minLevel: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(chalk.blue(`[INFO] ${message}`), ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.SUCCESS)) {
      console.log(chalk.green(`[SUCCESS] ${message}`), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(chalk.yellow(`[WARN] ${message}`), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(chalk.red(`[ERROR] ${message}`), ...args);
    }
  }

  header(message: string): void {
    console.log('\n' + chalk.bold.cyan('='.repeat(60)));
    console.log(chalk.bold.cyan(message.toUpperCase()));
    console.log(chalk.bold.cyan('='.repeat(60)) + '\n');
  }

  section(message: string): void {
    console.log('\n' + chalk.bold.magenta(`> ${message}`));
  }

  table(data: Record<string, any>): void {
    console.log();
    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = chalk.cyan(key.padEnd(25));
      const formattedValue = typeof value === 'string'
        ? chalk.white(value)
        : chalk.white(JSON.stringify(value));
      console.log(`${formattedKey}: ${formattedValue}`);
    });
    console.log();
  }

  link(url: string, label?: string): void {
    const text = label || url;
    console.log(chalk.blue.underline(text), chalk.gray(`(${url})`));
  }

  spinner(message: string): () => void {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    let intervalId: NodeJS.Timeout;

    process.stdout.write(chalk.cyan(`${frames[0]} ${message}...`));

    intervalId = setInterval(() => {
      i = (i + 1) % frames.length;
      process.stdout.write(`\r${chalk.cyan(`${frames[i]} ${message}...`)}`);
    }, 80);

    return () => {
      clearInterval(intervalId);
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
    };
  }

  progress(current: number, total: number, label: string = ''): void {
    const percentage = Math.floor((current / total) * 100);
    const filled = Math.floor(percentage / 2);
    const empty = 50 - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const info = label ? ` ${label}` : '';

    process.stdout.write(
      `\r${chalk.cyan('[')}${chalk.green(bar)}${chalk.cyan(']')} ${percentage}%${info}`
    );

    if (current === total) {
      process.stdout.write('\n');
    }
  }

  separator(): void {
    console.log(chalk.gray('-'.repeat(60)));
  }

  newline(): void {
    console.log();
  }
}

export const logger = new Logger();
