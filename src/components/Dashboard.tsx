import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslations } from '../lib/i18n';
import { MealPlanSection } from './MealPlanSection';
import { 
  LogOut, 
  Users, 
  CalendarDays, 
  LayoutDashboard, 
  Search, 
  ChevronRight, 
  Activity, 
  Clock,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ClipboardList,
  Sun,
  Moon,
  ChevronLeft,
  Edit,
  Save,
  X,
  TrendingUp
} from 'lucide-react';

interface DashboardProps {
  user: any;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE AUXILIAR: GRÁFICO DE EVOLUÇÃO SVG INTERATIVO (PREMIUM)
// ─────────────────────────────────────────────────────────────────────────────
interface EvolutionChartProps {
  patientConsultations: any[];
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ patientConsultations }) => {
  // Ordenar consultas por data crescente
  const sorted = [...patientConsultations].sort(
    (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
  );

  // Filtrar apenas as consultas que possuem dados válidos de peso ou gordura
  const data = sorted.filter(
    c => (c.peso !== null && !isNaN(parseFloat(c.peso))) || 
         (c.percentual_gordura !== null && !isNaN(parseFloat(c.percentual_gordura)))
  );

  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    item: any;
    type: 'peso' | 'gordura';
  } | null>(null);

  if (data.length === 0) {
    return (
      <div style={{
        padding: '3rem 1.5rem',
        fontStyle: 'italic',
        color: 'var(--text-muted)',
        textAlign: 'center',
        background: 'var(--bg-soft)',
        borderRadius: 'var(--radius-sm)',
        border: '1.5px dashed var(--border)'
      }}>
        Nenhum dado antropométrico (peso ou percentual de gordura) foi registrado para este paciente nas consultas ainda.
      </div>
    );
  }

  // Dimensões do canvas SVG
  const width = 500;
  const height = 230;
  const paddingX = 45;
  const paddingY = 35;

  const pesos = data.map(d => parseFloat(d.peso)).filter(val => !isNaN(val));
  const gorduras = data.map(d => parseFloat(d.percentual_gordura)).filter(val => !isNaN(val));

  // Determinar limites com margens inteligentes
  const minPeso = pesos.length > 0 ? Math.min(...pesos) - 3 : 40;
  const maxPeso = pesos.length > 0 ? Math.max(...pesos) + 3 : 120;

  const minGordura = gorduras.length > 0 ? Math.max(0, Math.min(...gorduras) - 2) : 5;
  const maxGordura = gorduras.length > 0 ? Math.min(60, Math.max(...gorduras) + 2) : 45;

  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}`; // Retorna DD/MM
  };

  const getX = (index: number) => {
    if (data.length === 1) return width / 2;
    return paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
  };

  const getYWeight = (val: number) => {
    if (maxPeso === minPeso) return height / 2;
    return height - paddingY - ((val - minPeso) * (height - 2 * paddingY)) / (maxPeso - minPeso);
  };

  const getYFat = (val: number) => {
    if (maxGordura === minGordura) return height / 2;
    return height - paddingY - ((val - minGordura) * (height - 2 * paddingY)) / (maxGordura - minGordura);
  };

  // Traçado das linhas (Caminho SVG)
  let pesoPath = '';
  let gorduraPath = '';
  let pesoAreaPath = '';
  let gorduraAreaPath = '';

  const pesoPoints = data.map((item, idx) => ({
    x: getX(idx),
    y: getYWeight(parseFloat(item.peso)),
    hasVal: !isNaN(parseFloat(item.peso))
  })).filter(p => p.hasVal);

  if (pesoPoints.length > 0) {
    pesoPath = `M ${pesoPoints[0].x} ${pesoPoints[0].y} ` + pesoPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    pesoAreaPath = `${pesoPath} L ${pesoPoints[pesoPoints.length - 1].x} ${height - paddingY} L ${pesoPoints[0].x} ${height - paddingY} Z`;
  }

  const gorduraPoints = data.map((item, idx) => ({
    x: getX(idx),
    y: getYFat(parseFloat(item.percentual_gordura)),
    hasVal: !isNaN(parseFloat(item.percentual_gordura))
  })).filter(p => p.hasVal);

  if (gorduraPoints.length > 0) {
    gorduraPath = `M ${gorduraPoints[0].x} ${gorduraPoints[0].y} ` + gorduraPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    gorduraAreaPath = `${gorduraPath} L ${gorduraPoints[gorduraPoints.length - 1].x} ${height - paddingY} L ${gorduraPoints[0].x} ${height - paddingY} Z`;
  }

  return (
    <div style={{ position: 'relative', width: '100%', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Legenda do Gráfico */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 650 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }}></span>
          <span style={{ color: 'var(--text)' }}>Evolução de Peso (kg)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--secondary)', borderRadius: '3px' }}></span>
          <span style={{ color: 'var(--text)' }}>% de Gordura Corporal</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="fatAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Linhas Horizontais de Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + ratio * (height - 2 * paddingY);
          return (
            <line
              key={idx}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Eixo de Base */}
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--border)" strokeWidth="1.5" />

        {/* Áreas preenchidas (Glow) */}
        {pesoAreaPath && <path d={pesoAreaPath} fill="url(#weightAreaGrad)" style={{ transition: 'all 0.5s ease' }} />}
        {gorduraAreaPath && <path d={gorduraAreaPath} fill="url(#fatAreaGrad)" style={{ transition: 'all 0.5s ease' }} />}

        {/* Linhas principais de dados */}
        {pesoPath && (
          <path 
            d={pesoPath} 
            fill="none" 
            stroke="var(--primary)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ transition: 'all 0.5s ease' }}
          />
        )}
        {gorduraPath && (
          <path 
            d={gorduraPath} 
            fill="none" 
            stroke="var(--secondary)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ transition: 'all 0.5s ease' }}
          />
        )}

        {/* Eixo X: Datas */}
        {data.map((item, idx) => {
          const x = getX(idx);
          return (
            <text
              key={idx}
              x={x}
              y={height - 12}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontWeight="600"
            >
              {formatShortDate(item.data_consulta)}
            </text>
          );
        })}

        {/* Círculos interativos de cada consulta */}
        {data.map((item, idx) => {
          const x = getX(idx);
          const pesoVal = parseFloat(item.peso);
          const gordVal = parseFloat(item.percentual_gordura);

          const hasPeso = !isNaN(pesoVal);
          const hasGord = !isNaN(gordVal);

          return (
            <g key={idx}>
              {/* Peso Ponto */}
              {hasPeso && (
                <circle
                  cx={x}
                  cy={getYWeight(pesoVal)}
                  r={hoveredPoint?.index === idx && hoveredPoint?.type === 'peso' ? 7.5 : 4.5}
                  fill="var(--bg-card)"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer', transition: 'r 0.1s ease, stroke-width 0.1s ease' }}
                  onMouseEnter={() => {
                    setHoveredPoint({
                      index: idx,
                      x: x,
                      y: getYWeight(pesoVal),
                      item,
                      type: 'peso'
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              )}

              {/* Gordura Ponto */}
              {hasGord && (
                <circle
                  cx={x}
                  cy={getYFat(gordVal)}
                  r={hoveredPoint?.index === idx && hoveredPoint?.type === 'gordura' ? 7.5 : 4.5}
                  fill="var(--bg-card)"
                  stroke="var(--secondary)"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer', transition: 'r 0.1s ease, stroke-width 0.1s ease' }}
                  onMouseEnter={() => {
                    setHoveredPoint({
                      index: idx,
                      x: x,
                      y: getYFat(gordVal),
                      item,
                      type: 'gordura'
                    });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip flutuante em HTML absoluto */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 58}%`,
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 650,
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem'
          }}
        >
          <span style={{ color: 'var(--text-subtle)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Calendar size={10} /> Consulta de {hoveredPoint.item.data_consulta.split('-').reverse().join('/')}
          </span>
          {hoveredPoint.type === 'peso' ? (
            <span style={{ color: 'var(--primary)' }}>
              Peso: <strong>{hoveredPoint.item.peso} kg</strong>
            </span>
          ) : (
            <span style={{ color: 'var(--secondary-dark)' }}>
              Gordura Corporal: <strong>{hoveredPoint.item.percentual_gordura}%</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ user, theme, toggleTheme }) => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pacientes' | 'agenda'>('dashboard');
  const [activePatientSubTab, setActivePatientSubTab] = useState<'ficha' | 'plano'>('ficha');
  
  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingPatientDetails, setIsFetchingPatientDetails] = useState(false);

  // Data states
  const [nomeNutricionista, setNomeNutricionista] = useState('Nutricionista');
  const [patients, setPatients] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [weeklyConsultationsCount, setWeeklyConsultationsCount] = useState(0);
  const [patientsWithoutReturn, setPatientsWithoutReturn] = useState<any[]>([]);
  
  // Interactive state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActivePatientSubTab('ficha');
  }, [selectedPatientId]);

  // Estados exclusivos da aba AGENDA (Calendário)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Estados de EDICAO de Ficha Clínica
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // Estado para Gráfico do Dashboard
  const [dashboardChartPatientId, setDashboardChartPatientId] = useState<string>('');

  // Estados para MODAIS DE CRIAÇÃO
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [showCreateConsultationModal, setShowCreateConsultationModal] = useState(false);
  const [showEditConsultationModal, setShowEditConsultationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTodayConsultationsPopup, setShowTodayConsultationsPopup] = useState(true);
  const [newPatientData, setNewPatientData] = useState({ nome: '', email: '', telefone: '' });
  const [newConsultationData, setNewConsultationData] = useState({ paciente_id: '', data_consulta: '', peso: '', percentual_gordura: '', observacoes: '', proximo_retorno: '' });
  const [editConsultationData, setEditConsultationData] = useState<any>(null);

  // Meses por extenso
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Fetch inicial de todos os dados do Supabase
  const loadAllData = async () => {
    try {
      setStatsLoading(true);
      setError(null);

      // 1. Perfil da Nutricionista
      const { data: nutri, error: nutriError } = await supabase
        .from('nutricionistas')
        .select('nome')
        .eq('id', user.id)
        .single();

      if (nutriError) {
        console.warn('Erro ao buscar perfil da nutricionista no banco:', nutriError);
        setNomeNutricionista(user.user_metadata?.nome || user.email?.split('@')[0] || 'Nutricionista');
      } else if (nutri) {
        setNomeNutricionista(nutri.nome);
      }

      // 2. Pacientes
      const { data: patientsData, error: patientsError } = await supabase
        .from('pacientes')
        .select('id, nome, email, data_nascimento, sexo, telefone, whatsapp, peso_inicial, altura, created_at')
        .eq('nutricionista_id', user.id)
        .order('nome', { ascending: true });

      if (patientsError) throw patientsError;
      setPatients(patientsData || []);

      if (patientsData && patientsData.length > 0) {
        // Inicializa com o primeiro paciente para o gráfico
        setDashboardChartPatientId(patientsData[0].id);
      }

      // 3. Consultas
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultas')
        .select('id, data_consulta, proximo_retorno, paciente_id, peso, percentual_gordura, observacoes')
        .order('data_consulta', { ascending: false });

      if (consultationsError) throw consultationsError;
      
      const patientIds = new Set((patientsData || []).map(p => p.id));
      const filteredConsultations = (consultationsData || []).filter(c => patientIds.has(c.paciente_id));
      setConsultations(filteredConsultations);

      // 4. Consultas da semana atual
      const today = new Date();
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);

      const end = new Date(today);
      end.setDate(today.getDate() + (6 - dayOfWeek));
      end.setHours(23, 59, 59, 999);

      const weeklyConsults = filteredConsultations.filter(c => {
        const cDate = new Date(c.data_consulta);
        return cDate >= start && cDate <= end;
      });
      setWeeklyConsultationsCount(weeklyConsults.length);

      // 5. Pacientes sem retorno (>30 dias e sem retornos agendados futuros)
      const normalizedToday = new Date();
      normalizedToday.setHours(0, 0, 0, 0);
      const withoutReturnList: any[] = [];

      (patientsData || []).forEach(patient => {
        const patientConsults = filteredConsultations.filter(c => c.paciente_id === patient.id);
        
        if (patientConsults.length > 0) {
          const sortedConsults = [...patientConsults].sort(
            (a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
          );
          
          const latestConsult = sortedConsults[0];
          const latestDate = new Date(latestConsult.data_consulta);
          
          const diffTime = normalizedToday.getTime() - latestDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          const hasUpcomingReturn = patientConsults.some(c => {
            if (!c.proximo_retorno) return false;
            const returnDate = new Date(c.proximo_retorno);
            return returnDate >= normalizedToday;
          });

          if (diffDays > 30 && !hasUpcomingReturn) {
            withoutReturnList.push({
              ...patient,
              daysSinceLast: diffDays,
              latestConsultDate: latestConsult.data_consulta
            });
          }
        }
      });

      setPatientsWithoutReturn(withoutReturnList);

    } catch (err: any) {
      console.error('Erro ao carregar dados do Dashboard:', err);
      setError(err.message || t.unexpectedError);
    } finally {
      setStatsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user.id]);

  useEffect(() => {
    if (!selectedPatientId) return;

    const patientObj = patients.find(p => p.id === selectedPatientId);
    if (!patientObj) return;

    // Se o campo 'alergias' (ou qualquer outra propriedade clínica) for undefined,
    // significa que este paciente ainda não teve sua ficha detalhada carregada sob demanda
    if (patientObj.alergias === undefined) {
      const fetchPatientDetails = async () => {
        try {
          setIsFetchingPatientDetails(true);
          const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .eq('id', selectedPatientId)
            .single();

          if (error) throw error;

          if (data) {
            // Injeta todos os dados detalhados obtidos do Supabase no estado do paciente específico
            setPatients(prev => prev.map(p => p.id === selectedPatientId ? { ...p, ...data } : p));
          }
        } catch (err: any) {
          console.warn('Erro ao carregar dados clínicos detalhados:', err);
          setError('Não foi possível carregar todos os dados da ficha clínica.');
        } finally {
          setIsFetchingPatientDetails(false);
        }
      };

      fetchPatientDetails();
    }
  }, [selectedPatientId, patients]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRedirectToPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('pacientes');
  };

  const formatSimpleDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('T')[0].split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Filtragem local baseada na barra de pesquisa
  const filteredPatients = patients.filter(p =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedPatientConsultations = consultations.filter(c => c.paciente_id === selectedPatientId);

  const primeiroNome = nomeNutricionista.split(' ')[0];

  // ─────────────────────────────────────────────────────────────────────────────
  // LÓGICA DE GERAÇÃO DO CALENDÁRIO MENSAL
  // ─────────────────────────────────────────────────────────────────────────────
  const getDaysInCalendar = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0: Dom, 1: Seg, ...
    const numDaysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const numDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const calendarCells: any[] = [];

    // Mês Anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = numDaysInPrevMonth - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      calendarCells.push({ day, month: m, year: y, isCurrentMonth: false });
    }

    // Mês Atual
    for (let i = 1; i <= numDaysInCurrentMonth; i++) {
      calendarCells.push({ day: i, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // Próximo Mês
    const totalCells = 42;
    const remainingCells = totalCells - calendarCells.length;
    for (let i = 1; i <= remainingCells; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      calendarCells.push({ day: i, month: m, year: y, isCurrentMonth: false });
    }

    return calendarCells;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const formatCalendarCellDate = (cell: any) => {
    const mm = String(cell.month + 1).padStart(2, '0');
    const dd = String(cell.day).padStart(2, '0');
    return `${cell.year}-${mm}-${dd}`;
  };

  // Verifica consultas no dia da célula
  const getConsultsForDate = (dateStr: string) => {
    return consultations.filter(c => c.data_consulta === dateStr);
  };

  // Verifica se há retornos previstos no dia da célula
  const getReturnsForDate = (dateStr: string) => {
    return consultations.filter(c => c.proximo_retorno === dateStr);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // LÓGICA DE FORMULÁRIO E SALVAMENTO (EDICAO)
  // ─────────────────────────────────────────────────────────────────────────────
  const startEditing = () => {
    if (!selectedPatient) return;
    setEditFormData({
      nome: selectedPatient.nome || '',
      email: selectedPatient.email || '',
      telefone: selectedPatient.telefone || '',
      whatsapp: selectedPatient.whatsapp || '',
      sexo: selectedPatient.sexo || '',
      data_nascimento: selectedPatient.data_nascimento || '',
      altura: selectedPatient.altura || '',
      peso_inicial: selectedPatient.peso_inicial || '',
      atividade_fisica: selectedPatient.atividade_fisica ?? false,
      atividade_fisica_descricao: selectedPatient.atividade_fisica_descricao || '',
      litros_agua: selectedPatient.litros_agua || '',
      refeicoes_por_dia: selectedPatient.refeicoes_por_dia || '',
      observacoes: selectedPatient.observacoes || '',
      // Arrays tratados como string separada por vírgula
      alergias_str: selectedPatient.alergias ? selectedPatient.alergias.join(', ') : '',
      patologias_str: selectedPatient.patologias ? selectedPatient.patologias.join(', ') : '',
      restricoes_str: selectedPatient.restricoes_alimentares ? selectedPatient.restricoes_alimentares.join(', ') : '',
      objetivos_str: selectedPatient.objetivos ? selectedPatient.objetivos.join(', ') : ''
    });
    setIsEditingPatient(true);
  };

  const parseArrayString = (str: string) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setIsSavingPatient(true);
    setError(null);

    const alergias = parseArrayString(editFormData.alergias_str);
    const patologias = parseArrayString(editFormData.patologias_str);
    const restricoes_alimentares = parseArrayString(editFormData.restricoes_str);
    const objetivos = parseArrayString(editFormData.objetivos_str);

    const payload = {
      nome: editFormData.nome,
      email: editFormData.email,
      telefone: editFormData.telefone,
      whatsapp: editFormData.whatsapp,
      sexo: editFormData.sexo,
      data_nascimento: editFormData.data_nascimento || null,
      altura: editFormData.altura ? parseFloat(editFormData.altura) : null,
      peso_inicial: editFormData.peso_inicial ? parseFloat(editFormData.peso_inicial) : null,
      atividade_fisica: editFormData.atividade_fisica,
      atividade_fisica_descricao: editFormData.atividade_fisica_descricao,
      litros_agua: editFormData.litros_agua ? parseFloat(editFormData.litros_agua) : null,
      refeicoes_por_dia: editFormData.refeicoes_por_dia ? parseInt(editFormData.refeicoes_por_dia) : null,
      observacoes: editFormData.observacoes,
      alergias,
      patologias,
      restricoes_alimentares,
      objetivos
    };

    try {
      const { error: saveError } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', selectedPatient.id);

      if (saveError) throw saveError;

      // Atualiza o estado de pacientes localmente
      setPatients(prev => prev.map(p => 
        p.id === selectedPatient.id 
          ? { ...p, ...payload } 
          : p
      ));

      setIsEditingPatient(false);
    } catch (err: any) {
      console.error('Erro ao salvar ficha do paciente:', err);
      setError(err.message || 'Erro ao salvar alterações no servidor.');
    } finally {
      setIsSavingPatient(false);
    }
  };

  // Renderizador principal da página com loading inicial
  if (loading) {
    return (
      <div className="loading-screen">
        <span className="logo-text animate-pulse" style={{ fontSize: '2rem' }}>
          Nutri <span>J</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  // Obter consultas do paciente do gráfico do dashboard
  const dashboardChartConsultations = consultations.filter(c => c.paciente_id === dashboardChartPatientId);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('pacientes').insert([{ ...newPatientData, nutricionista_id: user.id }]);
      if (error) throw error;
      setShowCreatePatientModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('consultas').insert([{
        paciente_id: newConsultationData.paciente_id,
        data_consulta: newConsultationData.data_consulta,
        peso: newConsultationData.peso ? parseFloat(newConsultationData.peso) : null,
        percentual_gordura: newConsultationData.percentual_gordura ? parseFloat(newConsultationData.percentual_gordura) : null,
        observacoes: newConsultationData.observacoes,
        proximo_retorno: newConsultationData.proximo_retorno || null
      }]);
      if (error) throw error;
      setShowCreateConsultationModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditConsultation = (consultation: any) => {
    setEditConsultationData({
      id: consultation.id,
      paciente_id: consultation.paciente_id,
      data_consulta: consultation.data_consulta,
      peso: consultation.peso || '',
      percentual_gordura: consultation.percentual_gordura || '',
      observacoes: consultation.observacoes || '',
      proximo_retorno: consultation.proximo_retorno || ''
    });
    setShowEditConsultationModal(true);
  };

  const handleUpdateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('consultas')
        .update({
          data_consulta: editConsultationData.data_consulta,
          peso: editConsultationData.peso ? parseFloat(editConsultationData.peso) : null,
          percentual_gordura: editConsultationData.percentual_gordura ? parseFloat(editConsultationData.percentual_gordura) : null,
          observacoes: editConsultationData.observacoes,
          proximo_retorno: editConsultationData.proximo_retorno || null
        })
        .eq('id', editConsultationData.id);

      if (error) throw error;
      setShowEditConsultationModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* ── BARRA LATERAL FICA (SIDEBAR) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/favicon.svg" alt="Nutri J Logo" style={{ width: '32px', height: '32px' }} />
          <span className="logo-text">
            Nutri <span>J</span>
            <span className="logo-badge">PRO</span>
          </span>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            {t.menuDashboard}
          </button>
          
          <button 
            className={`sidebar-item ${activeTab === 'pacientes' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pacientes');
              setIsEditingPatient(false);
            }}
          >
            <Users size={18} />
            {t.menuPatients}
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'agenda' ? 'active' : ''}`}
            onClick={() => setActiveTab('agenda')}
          >
            <CalendarDays size={18} />
            <span>Agenda & Consultas</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Botão de Toggle de Tema */}
          <button onClick={toggleTheme} className="sidebar-btn-logout" style={{ border: '1.5px solid var(--border)', background: 'transparent' }}>
            {theme === 'light' ? (
              <>
                <Moon size={14} style={{ color: 'var(--text-muted)' }} />
                <span>Tema Escuro</span>
              </>
            ) : (
              <>
                <Sun size={14} style={{ color: 'var(--secondary)' }} />
                <span>Tema Claro</span>
              </>
            )}
          </button>

          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar">
              {nomeNutricionista.substring(0, 1).toUpperCase()}
            </div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name" title={nomeNutricionista}>{nomeNutricionista}</span>
              <span className="sidebar-profile-role">Nutricionista</span>
            </div>
          </div>

          <button onClick={handleLogout} className="sidebar-btn-logout">
            <LogOut size={14} />
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* ── CONTEÚDO PRINCIPAL (MAIN CONTENT) ── */}
      <main className="main-content fade-in">
        {error && (
          <div className="error-alert" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            ABA 1: DASHBOARD
            ───────────────────────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            <div className="content-header">
              <div className="content-title">
                <h2>{t.greeting(primeiroNome)}</h2>
                <p>{t.dashboardSubtitle}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setNewPatientData({ nome: '', email: '', telefone: '' });
                    setShowCreatePatientModal(true);
                  }}
                  className="btn btn-primary" 
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Users size={16} />
                  {t.btnNewPatient}
                </button>
                <button 
                  onClick={() => {
                    setNewConsultationData({ paciente_id: '', data_consulta: new Date().toISOString().split('T')[0], peso: '', percentual_gordura: '', observacoes: '', proximo_retorno: '' });
                    setShowCreateConsultationModal(true);
                  }}
                  className="btn btn-outline" 
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', border: '1.5px solid var(--border)' }}
                >
                  <CalendarDays size={16} />
                  {t.btnNewConsultation}
                </button>
              </div>

              <div style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Sparkles size={14} />
                <span>Sistema Clinico Online</span>
              </div>
            </div>

            {statsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  {/* CARD 1 — Pacientes Ativos */}
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-card-label">{t.cardActivePatients}</span>
                      <div className="stat-card-icon">
                        <Users size={18} />
                      </div>
                    </div>
                    <div className="stat-card-value">{patients.length}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                      pacientes cadastrados
                    </span>
                  </div>

                  {/* CARD 2 — Consultas da Semana */}
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <span className="stat-card-label">{t.cardWeeklyConsultations}</span>
                      <div className="stat-card-icon">
                        <CalendarDays size={18} />
                      </div>
                    </div>
                    <div className="stat-card-value">{weeklyConsultationsCount}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                      {t.weeklyConsultationsSubtitle}
                    </span>
                  </div>

                  {/* CARD 3 — Pacientes Sem Retorno */}
                  <div className="stat-card" style={{ gridColumn: 'span 1', minHeight: '300px' }}>
                    <div className="stat-card-header">
                      <span className="stat-card-label">{t.cardNoReturn}</span>
                      <div className="stat-card-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
                        <Clock size={18} />
                      </div>
                    </div>
                    
                    {patientsWithoutReturn.length === 0 ? (
                      <div className="no-patients-message">
                        <ShieldAlert size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--text-subtle)' }} />
                        <p>{t.noPatientsNoReturn}</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          <span>Paciente</span>
                          <span>Última consulta</span>
                        </div>
                        <div className="stat-card-list">
                          {patientsWithoutReturn.map(p => (
                            <button
                              key={p.id}
                              className="patient-list-item"
                              onClick={() => handleRedirectToPatient(p.id)}
                              title={`Clique para ir ao perfil de ${p.nome}`}
                            >
                              <span className="patient-item-name">{p.nome}</span>
                              <span className="patient-item-meta">
                                {p.daysSinceLast} {t.days} {t.ago}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* GRÁFICO DE EVOLUÇÃO CLINICA (NOVO) */}
                <div className="fade-in" style={{
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '2rem',
                  marginBottom: '2rem',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>
                        <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                        Evolução Clínica do Paciente
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Acompanhe o progresso de peso e gordura corporal das consultas.
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Selecionar Paciente:</span>
                      <select
                        value={dashboardChartPatientId}
                        onChange={(e) => setDashboardChartPatientId(e.target.value)}
                        style={{
                          padding: '0.45rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--border)',
                          background: 'var(--bg)',
                          color: 'var(--text)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <EvolutionChart patientConsultations={dashboardChartConsultations} />
                </div>
              </>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            ABA 2: CLINICA / PACIENTES (DIRETÓRIO CLÍNICO)
            ───────────────────────────────────────────────────────────────────── */}
        {activeTab === 'pacientes' && (
          <div className="patients-container fade-in">
            <div className="patients-list-header">
              <div className="content-title">
                <h2>{t.menuPatients}</h2>
                <p>Gerencie as fichas clínicas e históricos dos seus pacientes.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.75fr', gap: '2rem', minHeight: '520px' }}>
              {/* PAINEL ESQUERDO: Lista de pacientes com pesquisa */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome ou e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.5rem', background: 'var(--bg-card)' }}
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem', 
                  maxHeight: '620px', 
                  overflowY: 'auto',
                  background: 'var(--bg-card)',
                  padding: '1rem',
                  borderRadius: 'var(--radius)',
                  border: '1.5px solid var(--border)'
                }}>
                  {filteredPatients.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0' }}>
                      Nenhum paciente encontrado.
                    </p>
                  ) : (
                    filteredPatients.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setIsEditingPatient(false);
                        }}
                        className={`patient-card ${selectedPatientId === p.id ? 'selected' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 650, color: 'var(--text)', fontSize: '0.95rem' }}>{p.nome}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email || 'Sem e-mail cadastrado'}</span>
                        </div>
                        <ChevronRight size={16} style={{ color: selectedPatientId === p.id ? 'var(--primary)' : 'var(--text-subtle)' }} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PAINEL DIREITO: Ficha Clínica ou Form de Edição */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--text)'
              }}>
                {selectedPatient ? (
                  isFetchingPatientDetails ? (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '6rem 0', gap: '1rem' }}>
                      <Loader2 size={38} className="animate-spin" style={{ color: 'var(--primary)' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 650 }}>Buscando ficha clínica no Supabase...</p>
                    </div>
                  ) : isEditingPatient ? (
                    /* ── FORMULÁRIO DE EDIÇÃO CLINICA (NOVO) ── */
                    <form onSubmit={handleSavePatient} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border)', paddingBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Editar Ficha Clínica</h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Altere os dados antropométricos ou clínicos do paciente.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingPatient(false)}
                          style={{
                            background: 'transparent',
                            border: '1.5px solid var(--border)',
                            color: 'var(--text-muted)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Seção 1: Identificação */}
                        <div style={{ background: 'var(--bg-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Users size={14} /> Dados Pessoais
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Nome Completo</label>
                              <input
                                type="text"
                                required
                                value={editFormData.nome}
                                onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>E-mail</label>
                              <input
                                type="email"
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Telefone</label>
                              <input
                                type="text"
                                value={editFormData.telefone}
                                onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>WhatsApp</label>
                              <input
                                type="text"
                                value={editFormData.whatsapp}
                                onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Sexo</label>
                              <select
                                value={editFormData.sexo}
                                onChange={(e) => setEditFormData({ ...editFormData, sexo: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'var(--bg)',
                                  border: '1.5px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--text)',
                                  outline: 'none'
                                }}
                              >
                                <option value="">Não informado</option>
                                <option value="Feminino">Feminino</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Outro">Outro</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Nascimento</label>
                              <input
                                type="date"
                                value={editFormData.data_nascimento}
                                onChange={(e) => setEditFormData({ ...editFormData, data_nascimento: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Seção 2: Dados Antropométricos e Hábitos */}
                        <div style={{ background: 'var(--bg-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Activity size={14} /> Físico & Hábitos
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Altura (m)</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="ex: 1.75"
                                value={editFormData.altura}
                                onChange={(e) => setEditFormData({ ...editFormData, altura: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Peso Inicial (kg)</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="ex: 78.5"
                                value={editFormData.peso_inicial}
                                onChange={(e) => setEditFormData({ ...editFormData, peso_inicial: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input
                                  type="checkbox"
                                  id="atvFisica"
                                  checked={editFormData.atividade_fisica}
                                  onChange={(e) => setEditFormData({ ...editFormData, atividade_fisica: e.target.checked })}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                />
                                <label htmlFor="atvFisica" style={{ display: 'inline', fontWeight: 600, cursor: 'pointer', color: 'var(--text)' }}>Pratica Atividade Física?</label>
                              </div>
                              {editFormData.atividade_fisica && (
                                <input
                                  type="text"
                                  placeholder="Qual atividade e frequência?"
                                  value={editFormData.atividade_fisica_descricao}
                                  onChange={(e) => setEditFormData({ ...editFormData, atividade_fisica_descricao: e.target.value })}
                                  style={{ background: 'var(--bg)', marginTop: '0.25rem' }}
                                />
                              )}
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Água por dia (L)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editFormData.litros_agua}
                                onChange={(e) => setEditFormData({ ...editFormData, litros_agua: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Refeições por dia</label>
                              <input
                                type="number"
                                value={editFormData.refeicoes_por_dia}
                                onChange={(e) => setEditFormData({ ...editFormData, refeicoes_por_dia: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Seção 3: Dados Clínicos Avançados */}
                        <div style={{ background: 'var(--bg-soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <ClipboardList size={14} /> Dados Clínicos (Separar por vírgula)
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Objetivos do Paciente</label>
                              <input
                                type="text"
                                placeholder="Hipertrofia, Emagrecimento, Disposição..."
                                value={editFormData.objetivos_str}
                                onChange={(e) => setEditFormData({ ...editFormData, objetivos_str: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Alergias Alimentares / Outras</label>
                              <input
                                type="text"
                                placeholder="ex: Glúten, Amendoim, Lactose"
                                value={editFormData.alergias_str}
                                onChange={(e) => setEditFormData({ ...editFormData, alergias_str: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Patologias / Condições Médicas</label>
                              <input
                                type="text"
                                placeholder="ex: Gastrite, Diabetes Tipo 2"
                                value={editFormData.patologias_str}
                                onChange={(e) => setEditFormData({ ...editFormData, patologias_str: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Restrições Alimentares / Aversões</label>
                              <input
                                type="text"
                                placeholder="ex: Carne Vermelha, Coentro"
                                value={editFormData.restricoes_str}
                                onChange={(e) => setEditFormData({ ...editFormData, restricoes_str: e.target.value })}
                                style={{ background: 'var(--bg)' }}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ color: 'var(--text)' }}>Conduta & Observações Gerais</label>
                              <textarea
                                value={editFormData.observacoes}
                                onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                                style={{
                                  width: '100%',
                                  minHeight: '80px',
                                  padding: '0.75rem 1rem',
                                  background: 'var(--bg)',
                                  border: '1.5px solid var(--border)',
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--text)',
                                  outline: 'none',
                                  fontFamily: "'Inter', sans-serif",
                                  resize: 'vertical'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', borderTop: '1.5px solid var(--border)', paddingTop: '1.25rem' }}>
                        <button
                          type="submit"
                          disabled={isSavingPatient}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.75rem' }}
                        >
                          {isSavingPatient ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Salvando Ficha...</span>
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              <span>Salvar Ficha Clínica</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isSavingPatient}
                          onClick={() => setIsEditingPatient(false)}
                          className="btn btn-outline"
                          style={{ flex: 1, padding: '0.75rem' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── MODO VISUALIZAÇÃO DE FICHA CLINICA ── */
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                      {/* Cabeçalho do Perfil */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid var(--border)', paddingBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.3rem'
                          }}>
                            {selectedPatient.nome.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>{selectedPatient.nome}</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Mail size={12} /> {selectedPatient.email || 'Não informado'}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Phone size={12} /> {selectedPatient.telefone || selectedPatient.whatsapp || 'Não informado'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setActivePatientSubTab('ficha')}
                            className="btn btn-outline"
                            style={{
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.8rem',
                              borderRadius: 'var(--radius-sm)',
                              border: activePatientSubTab === 'ficha' ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                              background: activePatientSubTab === 'ficha' ? 'var(--primary-light)' : 'transparent',
                              color: activePatientSubTab === 'ficha' ? 'var(--primary)' : 'var(--text-muted)',
                              fontWeight: 650,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              cursor: 'pointer'
                            }}
                          >
                            <ClipboardList size={12} />
                            <span>Ficha Clínica</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActivePatientSubTab('plano')}
                            className="btn btn-outline"
                            style={{
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.8rem',
                              borderRadius: 'var(--radius-sm)',
                              border: activePatientSubTab === 'plano' ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                              background: activePatientSubTab === 'plano' ? 'var(--primary-light)' : 'transparent',
                              color: activePatientSubTab === 'plano' ? 'var(--primary)' : 'var(--text-muted)',
                              fontWeight: 650,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              cursor: 'pointer'
                            }}
                          >
                            <Sparkles size={12} />
                            <span>Plano Alimentar IA</span>
                          </button>

                          {activePatientSubTab === 'ficha' && (
                            <button
                              type="button"
                              onClick={startEditing}
                              className="btn btn-outline"
                              style={{
                                padding: '0.45rem 0.85rem',
                                fontSize: '0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1.5px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text)',
                                fontWeight: 650,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit size={12} />
                              <span>Editar Ficha</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {activePatientSubTab === 'ficha' ? (
                        <>
                          {/* Detalhes Clínicos em Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.875rem' }}>
                            {/* Dados Físicos */}
                            <div style={{ background: 'var(--bg-soft)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 650, marginBottom: '0.85rem' }}>
                                <Activity size={15} /> Dados Físicos
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div><strong>Altura:</strong> {selectedPatient.altura ? `${selectedPatient.altura} m` : 'Não informada'}</div>
                                <div><strong>Peso Inicial:</strong> {selectedPatient.peso_inicial ? `${selectedPatient.peso_inicial} kg` : 'Não informado'}</div>
                                <div><strong>Nascimento:</strong> {selectedPatient.data_nascimento ? formatSimpleDate(selectedPatient.data_nascimento) : 'Não informada'}</div>
                                <div><strong>Sexo:</strong> {selectedPatient.sexo || 'Não informado'}</div>
                              </div>
                            </div>

                            {/* Estilo de Vida */}
                            <div style={{ background: 'var(--bg-soft)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 650, marginBottom: '0.85rem' }}>
                                <ClipboardList size={15} /> Estilo de Vida
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <div><strong>Objetivos:</strong> {selectedPatient.objetivos && selectedPatient.objetivos.length > 0 ? selectedPatient.objetivos.join(', ') : 'Não definidos'}</div>
                                <div><strong>Atividade Física:</strong> {selectedPatient.atividade_fisica ? 'Sim' : 'Não'} {selectedPatient.atividade_fisica_descricao ? `(${selectedPatient.atividade_fisica_descricao})` : ''}</div>
                                <div><strong>Consumo de Água:</strong> {selectedPatient.litros_agua ? `${selectedPatient.litros_agua} L/dia` : 'Não informado'}</div>
                                <div><strong>Refeições/dia:</strong> {selectedPatient.refeicoes_por_dia || 'Não informado'}</div>
                              </div>
                            </div>
                          </div>

                          {/* Alergias & Patologias */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.875rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                              <h4 style={{ color: 'var(--error)', fontWeight: 650, marginBottom: '0.6rem' }}>Alergias & Patologias</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div><strong>Alergias:</strong> {selectedPatient.alergias && selectedPatient.alergias.length > 0 ? selectedPatient.alergias.join(', ') : 'Nenhuma registrada'}</div>
                                <div><strong>Patologias:</strong> {selectedPatient.patologias && selectedPatient.patologias.length > 0 ? selectedPatient.patologias.join(', ') : 'Nenhuma registrada'}</div>
                              </div>
                            </div>

                            <div style={{ background: 'var(--secondary-light)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                              <h4 style={{ color: 'var(--secondary-dark)', fontWeight: 650, marginBottom: '0.6rem' }}>Restrições & Observações</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div><strong>Restrições:</strong> {selectedPatient.restricoes_alimentares && selectedPatient.restricoes_alimentares.length > 0 ? selectedPatient.restricoes_alimentares.join(', ') : 'Nenhuma registrada'}</div>
                                <div><strong>Observações:</strong> {selectedPatient.observacoes || 'Nenhuma registrada'}</div>
                              </div>
                            </div>
                          </div>

                          {/* Histórico Clínico de Consultas */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text)', fontWeight: 650, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                              <Calendar size={15} /> Histórico de Consultas
                            </h4>
                            {selectedPatientConsultations.length === 0 ? (
                              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
                                Nenhuma consulta registrada para este paciente ainda.
                              </p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {selectedPatientConsultations.map(c => (
                                  <div key={c.id} style={{
                                    padding: '1rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.4rem',
                                    fontSize: '0.85rem',
                                    background: 'var(--bg-soft)'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                      <span style={{ color: 'var(--primary)' }}>Consulta em {formatSimpleDate(c.data_consulta)}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        {c.proximo_retorno && (
                                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Próximo retorno: {formatSimpleDate(c.proximo_retorno)}</span>
                                        )}
                                        <button 
                                          onClick={() => handleOpenEditConsultation(c)}
                                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 600 }}
                                        >
                                          <Edit size={14} />
                                          {t.btnEditConsultation}
                                        </button>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                      <span><strong>Peso:</strong> {c.peso ? `${c.peso} kg` : '—'}</span>
                                      <span><strong>Gordura Corporal:</strong> {c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}</span>
                                    </div>
                                    {c.observacoes && (
                                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem', borderTop: '1px solid var(--border)', paddingTop: '0.3rem' }}>
                                        <strong>Conduta/Obs:</strong> {c.observacoes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <MealPlanSection 
                          patient={selectedPatient} 
                          consultations={selectedPatientConsultations} 
                        />
                      )}
                    </div>
                  )
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    flex: 1,
                    color: 'var(--text-subtle)'
                  }}>
                    <Users size={48} />
                    <p style={{ fontWeight: 550, fontSize: '0.95rem' }}>
                      Selecione um paciente na lista lateral para ver sua ficha clínica completa.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            ABA 3: AGENDA & CALENDÁRIO (NOVA)
            ───────────────────────────────────────────────────────────────────── */}
        {activeTab === 'agenda' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="content-header">
              <div className="content-title">
                <h2>Agenda de Consultas</h2>
                <p>Navegue pelo calendário mensal para verificar e agendar consultas.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
              {/* Calendário Interativo à Esquerda */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {/* Cabeçalho do Calendário */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {meses[currentMonth]} de {currentYear}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={handlePrevMonth}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Grid dos Dias de Semana */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '0.5rem',
                  textAlign: 'center',
                  fontWeight: 650,
                  fontSize: '0.8rem',
                  color: 'var(--text-subtle)',
                  marginBottom: '0.75rem'
                }}>
                  <span>DOM</span>
                  <span>SEG</span>
                  <span>TER</span>
                  <span>QUA</span>
                  <span>QUI</span>
                  <span>SEX</span>
                  <span>SAB</span>
                </div>

                {/* Grid de Dias */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '0.5rem'
                }}>
                  {getDaysInCalendar().map((cell, idx) => {
                    const formattedDate = formatCalendarCellDate(cell);
                    const isSelected = selectedCalendarDate === formattedDate;
                    const hasConsults = getConsultsForDate(formattedDate).length > 0;
                    const hasReturns = getReturnsForDate(formattedDate).length > 0;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCalendarDate(formattedDate)}
                        style={{
                          height: '62px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '0.4rem',
                          background: isSelected 
                            ? 'var(--primary)' 
                            : cell.isCurrentMonth ? 'var(--bg-soft)' : 'transparent',
                          border: isSelected 
                            ? '1.5px solid var(--primary)' 
                            : '1.5px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          opacity: cell.isCurrentMonth ? 1 : 0.45,
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Número do Dia */}
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: isSelected ? '#ffffff' : 'var(--text)'
                        }}>
                          {cell.day}
                        </span>

                        {/* Indicadores de Consulta / Retorno */}
                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'center' }}>
                          {hasConsults && (
                            <span 
                              title="Consulta agendada" 
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                background: isSelected ? '#ffffff' : 'var(--primary)', 
                                borderRadius: '50%' 
                              }}
                            />
                          )}
                          {hasReturns && (
                            <span 
                              title="Retorno previsto" 
                              style={{ 
                                width: '6px', 
                                height: '6px', 
                                background: isSelected ? '#ffffff' : 'var(--secondary)', 
                                borderRadius: '50%' 
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informações detalhadas do Dia selecionado à Direita */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                color: 'var(--text)'
              }}>
                <div style={{ borderBottom: '1.5px solid var(--border)', paddingBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 650, color: 'var(--text-subtle)' }}>
                    Consultas agendadas
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.15rem' }}>
                    {selectedCalendarDate.split('-').reverse().join('/')}
                  </h3>
                  <button 
                    onClick={() => {
                      setNewConsultationData({ ...newConsultationData, data_consulta: selectedCalendarDate, paciente_id: '' });
                      setShowCreateConsultationModal(true);
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Calendar size={14} />
                    {t.scheduleForThisDay}
                  </button>
                </div>

                {/* Listagem de Consultas / Retornos do Dia */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                  {getConsultsForDate(selectedCalendarDate).length === 0 && getReturnsForDate(selectedCalendarDate).length === 0 ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.75rem',
                      height: '100%',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: '2rem 0'
                    }}>
                      <CalendarDays size={32} style={{ color: 'var(--text-subtle)' }} />
                      <p style={{ fontSize: '0.88rem', fontStyle: 'italic' }}>
                        Nenhuma consulta ou retorno agendado para esta data.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Consultas Realizadas/Marcadas */}
                      {getConsultsForDate(selectedCalendarDate).map(c => {
                        const patientObj = patients.find(p => p.id === c.paciente_id);
                        return (
                          <div 
                            key={c.id}
                            style={{
                              padding: '1rem',
                              border: '1.5px solid var(--border)',
                              background: 'var(--bg-soft)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                                {patientObj ? patientObj.nome : 'Paciente Clínico'}
                              </span>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                background: 'var(--primary-light)',
                                color: 'var(--primary)',
                                border: '1px solid rgba(15, 76, 129, 0.2)'
                              }}>
                                Consulta
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {c.peso && <span><strong>Peso:</strong> {c.peso} kg</span>}
                              {c.percentual_gordura && <span><strong>Gordura:</strong> {c.percentual_gordura}%</span>}
                            </div>

                            {c.observacoes && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '0.4rem' }}>
                                <strong>Obs:</strong> {c.observacoes}
                              </p>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                              {patientObj && (
                                <button
                                  onClick={() => handleRedirectToPatient(patientObj.id)}
                                  className="btn btn-outline"
                                  style={{
                                    padding: '0.4rem',
                                    fontSize: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    flex: 1,
                                    background: 'var(--bg-card)'
                                  }}
                                >
                                  <Users size={12} />
                                  <span>Ver Ficha</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditConsultation(c)}
                                className="btn btn-outline"
                                style={{
                                  padding: '0.4rem',
                                  fontSize: '0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  flex: 1,
                                  background: 'var(--bg-card)'
                                }}
                              >
                                <Edit size={12} />
                                <span>{t.btnEditConsultation}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Retornos Agendados */}
                      {getReturnsForDate(selectedCalendarDate).map(c => {
                        const patientObj = patients.find(p => p.id === c.paciente_id);
                        return (
                          <div 
                            key={c.id + '-retorno'}
                            style={{
                              padding: '1rem',
                              border: '1.5px solid rgba(217, 119, 6, 0.2)',
                              background: 'var(--secondary-light)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                                {patientObj ? patientObj.nome : 'Paciente Clínico'}
                              </span>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                background: 'rgba(217, 119, 6, 0.1)',
                                color: 'var(--secondary-dark)',
                                border: '1px solid rgba(217, 119, 6, 0.2)'
                              }}>
                                Retorno
                              </span>
                            </div>

                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Retorno previsto agendado na consulta anterior de {formatSimpleDate(c.data_consulta)}.
                            </p>

                            {patientObj && (
                              <button
                                onClick={() => handleRedirectToPatient(patientObj.id)}
                                className="btn btn-outline"
                                style={{
                                  padding: '0.4rem',
                                  fontSize: '0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  width: '100%',
                                  marginTop: '0.25rem',
                                  background: 'var(--bg-card)',
                                  borderColor: 'rgba(217, 119, 6, 0.3)',
                                  color: 'var(--secondary-dark)'
                                }}
                              >
                                <Users size={12} />
                                <span>Ver Ficha Completa</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modais de Cadastro */}
        {showCreatePatientModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="fade-in" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '400px', maxWidth: '90%', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Novo Paciente</h3>
                <button onClick={() => setShowCreatePatientModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Nome Completo *</label>
                  <input type="text" required value={newPatientData.nome} onChange={e => setNewPatientData({...newPatientData, nome: e.target.value})} style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>E-mail</label>
                  <input type="email" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Telefone</label>
                  <input type="text" value={newPatientData.telefone} onChange={e => setNewPatientData({...newPatientData, telefone: e.target.value})} style={{ background: 'var(--bg)' }} />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem' }}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Cadastrar Paciente'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showCreateConsultationModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="fade-in" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '450px', maxWidth: '90%', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Nova Consulta</h3>
                <button onClick={() => setShowCreateConsultationModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Paciente *</label>
                  <select 
                    required 
                    value={newConsultationData.paciente_id} 
                    onChange={e => setNewConsultationData({...newConsultationData, paciente_id: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      background: 'var(--bg)', 
                      border: '1.5px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', 
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                  >
                    <option value="">Selecione um paciente</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Data da Consulta *</label>
                  <input type="date" required value={newConsultationData.data_consulta} onChange={e => setNewConsultationData({...newConsultationData, data_consulta: e.target.value})} style={{ background: 'var(--bg)' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text)' }}>Peso (kg)</label>
                    <input type="number" step="0.1" value={newConsultationData.peso} onChange={e => setNewConsultationData({...newConsultationData, peso: e.target.value})} style={{ background: 'var(--bg)' }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text)' }}>Gordura (%)</label>
                    <input type="number" step="0.1" value={newConsultationData.percentual_gordura} onChange={e => setNewConsultationData({...newConsultationData, percentual_gordura: e.target.value})} style={{ background: 'var(--bg)' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Observações</label>
                  <textarea value={newConsultationData.observacoes} onChange={e => setNewConsultationData({...newConsultationData, observacoes: e.target.value})} style={{ background: 'var(--bg)', minHeight: '80px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)' }} />
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Próximo Retorno (opcional)</label>
                  <input type="date" value={newConsultationData.proximo_retorno} onChange={e => setNewConsultationData({...newConsultationData, proximo_retorno: e.target.value})} style={{ background: 'var(--bg)' }} />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem' }}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Registrar Consulta'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showEditConsultationModal && editConsultationData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="fade-in" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius)', width: '450px', maxWidth: '90%', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{t.editConsultationTitle}</h3>
                <button onClick={() => setShowEditConsultationModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Paciente</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={patients.find(p => p.id === editConsultationData.paciente_id)?.nome || ''} 
                    style={{ background: 'var(--bg-soft)', color: 'var(--text-muted)', cursor: 'not-allowed' }} 
                  />
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Data da Consulta *</label>
                  <input type="date" required value={editConsultationData.data_consulta} onChange={e => setEditConsultationData({...editConsultationData, data_consulta: e.target.value})} style={{ background: 'var(--bg)' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text)' }}>Peso (kg)</label>
                    <input type="number" step="0.1" value={editConsultationData.peso} onChange={e => setEditConsultationData({...editConsultationData, peso: e.target.value})} style={{ background: 'var(--bg)' }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ color: 'var(--text)' }}>Gordura (%)</label>
                    <input type="number" step="0.1" value={editConsultationData.percentual_gordura} onChange={e => setEditConsultationData({...editConsultationData, percentual_gordura: e.target.value})} style={{ background: 'var(--bg)' }} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Observações</label>
                  <textarea value={editConsultationData.observacoes} onChange={e => setEditConsultationData({...editConsultationData, observacoes: e.target.value})} style={{ background: 'var(--bg)', minHeight: '80px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)' }} />
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text)' }}>Próximo Retorno (opcional)</label>
                  <input type="date" value={editConsultationData.proximo_retorno} onChange={e => setEditConsultationData({...editConsultationData, proximo_retorno: e.target.value})} style={{ background: 'var(--bg)' }} />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.75rem' }}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Atualizar Consulta'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Popup de Consultas do Dia */}
        {showTodayConsultationsPopup && getConsultsForDate(new Date().toISOString().split('T')[0]).length > 0 && (
          <div className="fade-in" style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--primary)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 999, width: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                <CalendarDays size={18} />
                <h4>Consultas de Hoje</h4>
              </div>
              <button onClick={() => setShowTodayConsultationsPopup(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Você tem {getConsultsForDate(new Date().toISOString().split('T')[0]).length} consulta(s) marcada(s) para hoje.
            </p>
            <button onClick={() => { setShowTodayConsultationsPopup(false); setActiveTab('agenda'); setSelectedCalendarDate(new Date().toISOString().split('T')[0]); }} className="btn btn-primary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
              Ver Agenda
            </button>
          </div>
        )}

      </main>
    </div>
  );
};
