/**
 * Detector de extensões do navegador que podem interferir com requests
 */

interface ExtensionInfo {
  id: string;
  name: string;
  detected: boolean;
  interference: 'high' | 'medium' | 'low';
}

class ExtensionDetector {
  private knownExtensions: Record<string, Omit<ExtensionInfo, 'detected'>> = {
    'hoklmmgfnpapgjgcpechhaamimifchmp': {
      id: 'hoklmmgfnpapgjgcpechhaamimifchmp',
      name: 'Unknown Extension (Frame Ant)',
      interference: 'high'
    },
    // Adicionar outras extensões conhecidas que causam problemas
    'adblock': {
      id: 'adblock',
      name: 'AdBlock',
      interference: 'medium'
    },
    'ublock': {
      id: 'ublock',
      name: 'uBlock Origin',
      interference: 'medium'
    }
  };

  /**
   * Detecta extensões que podem estar interferindo com requests
   */
  public detectInterferingExtensions(): ExtensionInfo[] {
    const detectedExtensions: ExtensionInfo[] = [];

    // Verificar se há modificações no fetch global
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      
      // Verificar se fetch foi modificado
      if (originalFetch.toString().includes('chrome-extension')) {
        detectedExtensions.push({
          ...this.knownExtensions['hoklmmgfnpapgjgcpechhaamimifchmp'],
          detected: true
        });
      }

      // Verificar por propriedades específicas de extensões
      const bodyElement = document.body;
      if (bodyElement) {
        // Verificar atributos adicionados por extensões
        if (bodyElement.hasAttribute('cz-shortcut-listen')) {
          detectedExtensions.push({
            id: 'cz-shortcut',
            name: 'CZ Shortcut Extension',
            detected: true,
            interference: 'medium'
          });
        }

        // Verificar por scripts injetados
        const scripts = document.querySelectorAll('script[src*="chrome-extension"]');
        scripts.forEach(script => {
          const src = script.getAttribute('src') || '';
          const extensionId = this.extractExtensionId(src);
          if (extensionId && this.knownExtensions[extensionId]) {
            detectedExtensions.push({
              ...this.knownExtensions[extensionId],
              detected: true
            });
          }
        });
      }
    }

    return detectedExtensions;
  }

  /**
   * Extrai ID da extensão de uma URL
   */
  private extractExtensionId(url: string): string | null {
    const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Verifica se há interferência ativa
   */
  public hasActiveInterference(): boolean {
    const extensions = this.detectInterferingExtensions();
    return extensions.some(ext => ext.interference === 'high');
  }

  /**
   * Gera relatório de extensões detectadas
   */
  public generateReport(): string {
    const extensions = this.detectInterferingExtensions();
    
    if (extensions.length === 0) {
      return 'Nenhuma extensão interferente detectada.';
    }

    let report = 'Extensões detectadas que podem interferir com requests:\n\n';
    
    extensions.forEach(ext => {
      report += `• ${ext.name} (${ext.id})\n`;
      report += `  Nível de interferência: ${ext.interference}\n\n`;
    });

    report += 'Recomendações:\n';
    report += '• Teste a aplicação em modo incógnito\n';
    report += '• Desative temporariamente as extensões\n';
    report += '• Use um navegador limpo para testes\n';

    return report;
  }

  /**
   * Aplica workarounds para extensões conhecidas
   */
  public applyWorkarounds(): void {
    if (typeof window === 'undefined') return;

    const extensions = this.detectInterferingExtensions();
    
    extensions.forEach(ext => {
      switch (ext.id) {
        case 'hoklmmgfnpapgjgcpechhaamimifchmp':
          this.applyFrameAntWorkaround();
          break;
        case 'cz-shortcut':
          this.applyCzShortcutWorkaround();
          break;
      }
    });
  }

  /**
   * Workaround para Frame Ant extension
   */
  private applyFrameAntWorkaround(): void {
    // Preservar referência ao fetch original
    if (window.fetch && !window.fetch.toString().includes('native')) {
      (window as any).__originalFetch = window.fetch.bind(window);
    }
  }

  /**
   * Workaround para CZ Shortcut extension
   */
  private applyCzShortcutWorkaround(): void {
    // Remover atributos que causam hydration mismatch
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'cz-shortcut-listen') {
          const target = mutation.target as Element;
          if (target.hasAttribute('cz-shortcut-listen')) {
            target.removeAttribute('cz-shortcut-listen');
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['cz-shortcut-listen']
    });
  }
}

export const extensionDetector = new ExtensionDetector();
export type { ExtensionInfo };