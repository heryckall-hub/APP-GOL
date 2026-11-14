import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode2, FolderTree } from 'lucide-react';
import {
  AndroidProjectFile,
  LauncherConfig,
  PROJECT_TREE_TEXT,
  buildAndroidProjectFiles
} from '../data/androidProjectFiles';

const CATEGORIES: AndroidProjectFile['category'][] = [
  'Manifest & Gradle',
  'Core & Tema',
  'Hardware & Trip',
  'ViewModel & Model',
  'Compose UI'
];

interface KotlinCodeExplorerProps {
  config: LauncherConfig;
}

export const KotlinCodeExplorer: React.FC<KotlinCodeExplorerProps> = ({ config }) => {
  const files = useMemo(() => buildAndroidProjectFiles(config), [config]);
  const [selectedId, setSelectedId] = useState<string>('manifest');
  const [showTree, setShowTree] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedFile = useMemo(
    () => files.find((f) => f.id === selectedId) ?? files[0],
    [files, selectedId]
  );

  const lines = useMemo(() => selectedFile.code.split('\n'), [selectedFile]);

  const handleCopyFile = async () => {
    const content = showTree ? PROJECT_TREE_TEXT : selectedFile.code;
    await navigator.clipboard.writeText(content);
    setCopiedId(showTree ? 'tree' : selectedFile.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadFile = () => {
    const content = showTree ? PROJECT_TREE_TEXT : selectedFile.code;
    const filename = showTree ? 'estrutura-projeto.txt' : selectedFile.name;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Sidebar de Estrutura e Arquivos */}
      <aside className="lg:col-span-3 cockpit-card-metallic rounded-2xl p-4 space-y-5">
        <div>
          <h2 className="font-display text-base font-bold text-white">
            Garagem Noturna MVP
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            com.garagem.launcher · minSdk 24 · Compose M3
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTree((v) => !v)}
          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all border ${
            showTree
              ? 'cockpit-card-glass cockpit-glow-cyan text-sky-300 font-semibold'
              : 'text-slate-200 hover:bg-white/5 hover:text-white border-white/10'
          }`}
        >
          <FolderTree className="h-4 w-4 shrink-0 text-sky-400" />
          <span>Estrutura de Pastas</span>
        </button>

        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const categoryFiles = files.filter((f) => f.category === category);
            return (
              <div key={category} className="space-y-1.5">
                <div className="cockpit-label px-2">{category}</div>
                <div className="space-y-1">
                  {categoryFiles.map((file) => {
                    const active = !showTree && file.id === selectedFile.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => {
                          setShowTree(false);
                          setSelectedId(file.id);
                        }}
                        className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                          active
                            ? 'cockpit-card-glass cockpit-glow-cyan text-sky-300 font-semibold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                      >
                        <FileCode2 className={`h-4 w-4 shrink-0 ${active ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span className="truncate">{file.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Visualizador de Código Completo */}
      <section className="lg:col-span-9 cockpit-card-metallic rounded-2xl overflow-hidden">
        <div className="cockpit-card-glass flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 rounded-none">
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold text-white truncate">
              {showTree ? 'Árvore de Diretórios do Projeto Android Studio' : selectedFile.path}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>
                {showTree
                  ? 'Coloque a foto do seu carro em app/src/main/res/drawable/meu_carro.png'
                  : selectedFile.summary}
              </span>
              {!showTree && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-sky-300">{lines.length} linhas</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadFile}
              className="cockpit-card-glass flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-100 hover:brightness-125 transition-all whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-sky-300" />
              <span>{showTree ? 'Baixar Árvore' : `Baixar ${selectedFile.name}`}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyFile}
              className="cockpit-neon-gradient flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white hover:brightness-110 transition-all whitespace-nowrap"
            >
              {copiedId === (showTree ? 'tree' : selectedFile.id) ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{showTree ? 'Copiar Estrutura' : 'Copiar Arquivo'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="max-h-[680px] overflow-auto p-4 font-mono text-[13px] leading-relaxed">
          {showTree ? (
            <pre className="whitespace-pre text-sky-200">{PROJECT_TREE_TEXT}</pre>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="hover:bg-slate-800/35">
                    <td className="w-12 select-none pr-4 text-right text-xs text-slate-600 tabular-nums align-top">
                      {index + 1}
                    </td>
                    <td className="whitespace-pre text-slate-200">{line || ' '}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};
