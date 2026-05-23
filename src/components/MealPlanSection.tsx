import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Sparkles, 
  Loader2, 
  Save, 
  Trash2, 
  Calendar, 
  ClipboardList, 
  AlertTriangle,
  CheckCircle,
  FileText,
  ChevronRight,
  Printer
} from 'lucide-react';

export interface Refeicoes {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: Refeicoes;
}

export interface PlanoAlimentarJSON {
  plano_semanal: DiaPlano[];
}

export interface PlanoAlimentarRow {
  id: string;
  paciente_id: string;
  conteudo: PlanoAlimentarJSON;
  created_at: string;
}

interface MealPlanSectionProps {
  patient: any;
  consultations: any[];
}

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

const REFEICOES_KEYS: { key: keyof Refeicoes; label: string; icon: string }[] = [
  { key: 'cafe_da_manha', label: 'Café da Manhã', icon: '🍳' },
  { key: 'lanche_manha', label: 'Lanche da Manhã', icon: '🍎' },
  { key: 'almoco', label: 'Almoço', icon: '🍲' },
  { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: '🍌' },
  { key: 'jantar', label: 'Jantar', icon: '🥗' }
];

export const MealPlanSection: React.FC<MealPlanSectionProps> = ({ patient, consultations }) => {
  const [history, setHistory] = useState<PlanoAlimentarRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Segunda-feira');
  
  // O plano que está em exibição/edição
  const [currentPlan, setCurrentPlan] = useState<PlanoAlimentarJSON | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  // Sistema de Toast simples para feedback premium
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Carregar histórico do banco de dados
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', patient.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar histórico de planos alimentares:', err);
      showToast('Erro ao carregar o histórico de planos.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (patient?.id) {
      loadHistory();
      setCurrentPlan(null);
      setPlanId(null);
    }
  }, [patient?.id]);

  // Mensagens dinâmicas do loading da IA
  useEffect(() => {
    if (!isGenerating) return;

    const steps = [
      'Buscando perfil do paciente...',
      'Analisando objetivos e restrições alimentares...',
      'Filtrando ingredientes para evitar alergias...',
      'Invocando o Gemini 2.5 Flash para calcular cardápio...',
      'Estruturando plano alimentar semanal em JSON...',
      'Finalizando ajustes e validando dados...'
    ];

    let currentStepIdx = 0;
    setGenerationStep(steps[0]);

    const interval = setInterval(() => {
      currentStepIdx = (currentStepIdx + 1) % steps.length;
      setGenerationStep(steps[currentStepIdx]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // Função para chamar a API e gerar o plano com IA
  const generateWithIA = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setCurrentPlan(null);
    setPlanId(null);

    // Formatar os dados do paciente de forma clara para o prompt
    const patientDataPayload = {
      nome: patient.nome,
      sexo: patient.sexo || 'Não informado',
      altura: patient.altura ? `${patient.altura}m` : 'Não informado',
      peso_inicial: patient.peso_inicial ? `${patient.peso_inicial}kg` : 'Não informado',
      atividade_fisica: patient.atividade_fisica ? `Sim (${patient.atividade_fisica_descricao || ''})` : 'Não',
      litros_agua: patient.litros_agua ? `${patient.litros_agua}L/dia` : 'Não informado',
      refeicoes_por_dia: patient.refeicoes_por_dia || 'Não informado',
      objetivos: patient.objetivos || [],
      alergias: patient.alergias || [],
      patologias: patient.patologias || [],
      restricoes_alimentares: patient.restricoes_alimentares || [],
      observacoes: patient.observacoes || '',
      historico_consultas: consultations.map(c => ({
        data: c.data_consulta,
        peso: c.peso,
        gordura: c.percentual_gordura,
        observacoes: c.observacoes
      }))
    };

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dados_do_paciente: patientDataPayload })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na requisição da API.');
      }

      const planData: PlanoAlimentarJSON = await response.json();

      if (!planData.plano_semanal || !Array.isArray(planData.plano_semanal)) {
        throw new Error('Formato retornado inválido.');
      }

      // Validar que possui todos os 7 dias e criar esqueleto se faltar
      const filledPlan: PlanoAlimentarJSON = {
        plano_semanal: DIAS_SEMANA.map(dia => {
          const diaEncontrado = planData.plano_semanal.find(
            d => d.dia.toLowerCase() === dia.toLowerCase()
          );

          if (diaEncontrado) {
            return {
              dia,
              refeicoes: {
                cafe_da_manha: fillOptions(diaEncontrado.refeicoes?.cafe_da_manha),
                lanche_manha: fillOptions(diaEncontrado.refeicoes?.lanche_manha),
                almoco: fillOptions(diaEncontrado.refeicoes?.almoco),
                lanche_tarde: fillOptions(diaEncontrado.refeicoes?.lanche_tarde),
                jantar: fillOptions(diaEncontrado.refeicoes?.jantar)
              }
            };
          }

          return {
            dia,
            refeicoes: createEmptyRefeicoes()
          };
        })
      };

      setCurrentPlan(filledPlan);
      showToast('Plano gerado com IA com sucesso! Edite ou salve abaixo.', 'success');
    } catch (err: any) {
      console.error('Erro na geração da IA:', err);
      showToast('Não foi possível gerar o plano com IA. Deseja criar um plano manual?', 'error');
      // Inicializa com plano vazio para o usuário preencher manualmente como fallback
      initManualPlan();
    } finally {
      setIsGenerating(false);
    }
  };

  const createEmptyRefeicoes = (): Refeicoes => ({
    cafe_da_manha: ['', '', '', '', ''],
    lanche_manha: ['', '', '', '', ''],
    almoco: ['', '', '', '', ''],
    lanche_tarde: ['', '', '', '', ''],
    jantar: ['', '', '', '', '']
  });

  const fillOptions = (arr: any): string[] => {
    const defaultOptions = ['', '', '', '', ''];
    if (!arr || !Array.isArray(arr)) return defaultOptions;
    return defaultOptions.map((_, i) => arr[i] || '');
  };

  // Inicializar um plano em branco para preenchimento manual
  const initManualPlan = () => {
    const blankPlan: PlanoAlimentarJSON = {
      plano_semanal: DIAS_SEMANA.map(dia => ({
        dia,
        refeicoes: createEmptyRefeicoes()
      }))
    };
    setCurrentPlan(blankPlan);
    setPlanId(null);
  };

  // Atualizar campo específico no plano ativo
  const handleInputChange = (
    diaNome: string,
    refeicaoKey: keyof Refeicoes,
    index: number,
    value: string
  ) => {
    if (!currentPlan) return;

    setCurrentPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        plano_semanal: prev.plano_semanal.map(d => {
          if (d.dia === diaNome) {
            const currentOptions = [...d.refeicoes[refeicaoKey]];
            currentOptions[index] = value;
            return {
              ...d,
              refeicoes: {
                ...d.refeicoes,
                [refeicaoKey]: currentOptions
              }
            };
          }
          return d;
        })
      };
    });
  };

  // Salvar plano alimentar no Supabase
  const saveMealPlan = async () => {
    if (!currentPlan) return;
    setIsSaving(true);

    try {
      let response;
      if (planId) {
        // Atualizar plano existente
        response = await supabase
          .from('planos_alimentares')
          .update({ conteudo: currentPlan })
          .eq('id', planId);
      } else {
        // Inserir novo registro de plano
        response = await supabase
          .from('planos_alimentares')
          .insert([
            {
              paciente_id: patient.id,
              conteudo: currentPlan
            }
          ]);
      }

      if (response.error) throw response.error;

      showToast('Plano alimentar salvo no histórico com sucesso!', 'success');
      loadHistory(); // Atualiza a lista lateral
      
      // Limpa a tela ou volta para a visualização
      setCurrentPlan(null);
      setPlanId(null);
    } catch (err: any) {
      console.error('Erro ao salvar plano alimentar:', err);
      showToast('Não foi possível salvar o plano alimentar no servidor.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir plano alimentar do histórico
  const deleteMealPlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita carregar o plano deletado
    if (!confirm('Deseja realmente remover este plano do histórico?')) return;

    try {
      const { error } = await supabase
        .from('planos_alimentares')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Plano alimentar excluído.', 'info');
      if (planId === id) {
        setCurrentPlan(null);
        setPlanId(null);
      }
      loadHistory();
    } catch (err: any) {
      console.error('Erro ao deletar plano:', err);
      showToast('Erro ao remover plano do histórico.', 'error');
    }
  };

  // Carregar um plano do histórico na tela de edição
  const selectPlanFromHistory = (row: PlanoAlimentarRow) => {
    // Garantir que todos os campos estão devidamente formatados
    const plan = row.conteudo;
    const sanitizedPlan: PlanoAlimentarJSON = {
      plano_semanal: DIAS_SEMANA.map(dia => {
        const matchingDay = plan.plano_semanal?.find(
          d => d.dia.toLowerCase() === dia.toLowerCase()
        );

        if (matchingDay) {
          return {
            dia,
            refeicoes: {
              cafe_da_manha: fillOptions(matchingDay.refeicoes?.cafe_da_manha),
              lanche_manha: fillOptions(matchingDay.refeicoes?.lanche_manha),
              almoco: fillOptions(matchingDay.refeicoes?.almoco),
              lanche_tarde: fillOptions(matchingDay.refeicoes?.lanche_tarde),
              jantar: fillOptions(matchingDay.refeicoes?.jantar)
            }
          };
        }

        return {
          dia,
          refeicoes: createEmptyRefeicoes()
        };
      })
    };

    setCurrentPlan(sanitizedPlan);
    setPlanId(row.id);
  };

  // Gerar e imprimir o plano alimentar em PDF formatado premium
  const handlePrintPDF = () => {
    if (!currentPlan) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Por favor, permita popups para poder imprimir o PDF.', 'error');
      return;
    }

    let htmlContent = `
      <html>
        <head>
          <title>Plano Alimentar - ${patient.nome}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;850&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1f2937;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2.5px solid #10b981;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 26px;
              font-weight: 850;
              color: #111827;
              letter-spacing: -0.5px;
            }
            .logo span {
              color: #10b981;
            }
            .meta-info {
              text-align: right;
              font-size: 13px;
              color: #4b5563;
              line-height: 1.6;
            }
            .patient-box {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 18px;
              margin-bottom: 30px;
              font-size: 13.5px;
            }
            .patient-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 10px;
            }
            .day-card {
              page-break-inside: avoid;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 22px;
              margin-bottom: 25px;
              background: #ffffff;
            }
            .day-title {
              font-size: 18px;
              font-weight: 700;
              color: #047857;
              border-bottom: 1.5px solid #10b981;
              padding-bottom: 8px;
              margin-top: 0;
              margin-bottom: 18px;
            }
            .meal-row {
              margin-bottom: 15px;
            }
            .meal-label {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #9ca3af;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .meal-content {
              font-size: 14px;
              color: #374151;
              padding-left: 10px;
              border-left: 3px solid #10b981;
              line-height: 1.5;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .day-card {
                border: 1px solid #e5e7eb;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Nutri <span>J</span></div>
            <div class="meta-info">
              <div><strong>Nutricionista Responsável:</strong> Clínico Geral</div>
              <div><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div class="patient-box">
            <h3 style="margin-top: 0; margin-bottom: 5px; color: #111827; font-size: 16px;">Plano Alimentar Semanal Prescrito</h3>
            <div class="patient-grid">
              <div><strong>Paciente:</strong> ${patient.nome}</div>
              <div><strong>Objetivo Principal:</strong> ${patient.objetivos && patient.objetivos.length > 0 ? patient.objetivos.join(', ') : 'Não informado'}</div>
              <div><strong>Água Recomendada:</strong> ${patient.litros_agua ? `${patient.litros_agua}L/dia` : 'Não informado'}</div>
              <div><strong>Restrições Alimentares:</strong> ${patient.restricoes_alimentares && patient.restricoes_alimentares.length > 0 ? patient.restricoes_alimentares.join(', ') : 'Nenhuma'}</div>
            </div>
          </div>
    `;

    currentPlan.plano_semanal.forEach((dia) => {
      const hasMeal = Object.keys(dia.refeicoes).some(
        (key) => dia.refeicoes[key as keyof Refeicoes].some(o => o.trim() !== '')
      );

      if (hasMeal) {
        htmlContent += `
          <div class="day-card">
            <h4 class="day-title">${dia.dia}</h4>
        `;

        REFEICOES_KEYS.forEach(({ key, label }) => {
          const opcoesValidas = dia.refeicoes[key].filter(o => o.trim() !== '');
          if (opcoesValidas.length > 0) {
            htmlContent += `
              <div class="meal-row">
                <div class="meal-label">${label}</div>
                <div class="meal-content">
                  ${opcoesValidas.map(o => `• ${o}`).join('<br/>')}
                </div>
              </div>
            `;
          }
        });

        htmlContent += `</div>`;
      }
    });

    htmlContent += `
          <div class="footer">
            Este plano alimentar foi elaborado sob medida com base nas suas necessidades específicas. Siga as orientações nutricionais.
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Limpar formulário de edição atual
  const cancelEdition = () => {
    if (confirm('Deseja descartar as alterações do plano em foco?')) {
      setCurrentPlan(null);
      setPlanId(null);
    }
  };

  const activeDayData = currentPlan?.plano_semanal.find(d => d.dia === activeTab);

  return (
    <div className="flex flex-col gap-5" style={{ minHeight: '350px' }}>
      {/* Toast flutuante premium */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 scale-100`}
          style={{
            background: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            color: '#fff',
            borderColor: toast.type === 'success' ? '#059669' : toast.type === 'error' ? '#dc2626' : '#2563eb'
          }}
        >
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertTriangle size={18} />}
          {toast.type === 'info' && <ClipboardList size={18} />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* HEADER DE GERAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
        <div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="text-emerald-500 animate-pulse" size={18} />
            Geração de Planos Alimentares com IA
          </h3>
          <p className="text-2xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Clique no botão abaixo para que nossa inteligência artificial analise o peso, estilo de vida, objetivos e restrições alimentares de <strong>{patient.nome}</strong> e monte um cardápio semanal completo.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button
            onClick={generateWithIA}
            disabled={isGenerating || isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md transition-all duration-200 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Gerar Plano com IA</span>
              </>
            )}
          </button>

          {!currentPlan && (
            <button
              onClick={initManualPlan}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 font-semibold text-xs transition-all"
            >
              Plano Manual
            </button>
          )}
        </div>
      </div>

      {/* OVERLAY DE LOADING DA IA */}
      {isGenerating && (
        <div className="flex flex-col items-center justify-center p-12 my-2 bg-white dark:bg-gray-950 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-900 shadow-inner">
          <div className="relative flex items-center justify-center w-14 h-14">
            <div className="absolute inset-0 border-4 border-emerald-200 dark:border-emerald-900 rounded-full animate-ping opacity-30"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="text-emerald-500 animate-pulse" size={20} />
          </div>
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mt-4 text-sm">Criando Cardápio Exclusivo</h4>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium animate-pulse text-center">
            {generationStep}
          </p>
        </div>
      )}

      {/* HISTÓRICO DE PLANOS EM GRID DE CARD */}
      {!isGenerating && (
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2 border-b border-gray-100 dark:border-gray-900 pb-2">
            <Calendar size={14} />
            Histórico de Planos Alimentares
          </h4>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-900/5 text-gray-400">
              <ClipboardList size={32} className="text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center">
                Nenhum plano alimentar gerado anteriormente para este paciente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
              {history.map((row) => (
                <div
                  key={row.id}
                  onClick={() => selectPlanFromHistory(row)}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-emerald-500 dark:hover:border-emerald-800 cursor-pointer transition-all duration-150 group shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start gap-2.5 overflow-hidden">
                    <FileText className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Plano Alimentar Semanal
                      </span>
                      <span className="text-2xs text-gray-400 mt-0.5">
                        {new Date(row.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteMealPlan(row.id, e)}
                    className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shrink-0"
                    title="Excluir Plano"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE EDIÇÃO DO PLANO EM JANELA ORGANIZADA AMPLA */}
      {currentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-950 w-[94vw] max-w-6xl h-[86vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4.5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shrink-0 gap-3">
              <div>
                <h4 className="font-bold text-base flex items-center gap-2">
                  <Sparkles size={18} />
                  {planId ? 'Editar Plano Alimentar Salvo' : 'Gerar Novo Plano com IA'}
                </h4>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Paciente: <strong className="text-white">{patient.nome}</strong>
                </p>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePrintPDF}
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all active:scale-98"
                >
                  <Printer size={13} />
                  <span>Imprimir PDF</span>
                </button>

                <button
                  onClick={saveMealPlan}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 font-bold text-xs shadow-sm transition-all active:scale-98 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  <span>Salvar no Histórico</span>
                </button>
                
                <button
                  onClick={cancelEdition}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-400 hover:bg-emerald-600/30 text-white font-semibold text-xs transition-all active:scale-98"
                >
                  Descartar
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              
              {/* Left Sidebar inside Modal: Days Navigation */}
              <div className="w-52 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 flex flex-col p-4 shrink-0 overflow-y-auto">
                <h5 className="text-2xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dias da Semana</h5>
                <div className="flex flex-col gap-1.5">
                  {DIAS_SEMANA.map((dia) => {
                    const isSelected = activeTab === dia;
                    return (
                      <button
                        key={dia}
                        onClick={() => setActiveTab(dia)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-900 border border-transparent'
                        }`}
                      >
                        <span>{dia.split('-')[0]}</span>
                        {isSelected && <ChevronRight size={14} className="text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Meals Inputs */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-950/5">
                {activeDayData && (
                  <div className="flex flex-col gap-5 max-w-4xl mx-auto">
                    
                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                      <span className="text-base">🗓️</span>
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                        Cardápio de {activeTab}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {REFEICOES_KEYS.map(({ key, label, icon }) => (
                        <div 
                          key={key} 
                          className="flex flex-col gap-3.5 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:shadow-xs transition-shadow"
                          style={{ gridColumn: key === 'almoco' || key === 'jantar' ? 'span 2' : 'span 1' }}
                        >
                          <h5 className="font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-900 pb-2">
                            <span className="text-sm">{icon}</span>
                            <span>{label}</span>
                          </h5>
                          
                          <div className="flex flex-col gap-2.5">
                            {activeDayData.refeicoes[key].map((opcao, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-2xs font-semibold text-emerald-500/60 w-4 shrink-0 text-right">
                                  #{idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={opcao}
                                  onChange={(e) => handleInputChange(activeDayData.dia, key, idx, e.target.value)}
                                  placeholder={`Digite a opção ${idx + 1} de alimento...`}
                                  className="w-full text-xs px-3.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-emerald-500 bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-200 transition-colors"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
