import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Wrench, Users, AlertCircle, ShieldCheck, Clock, Plus, FileText } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEquipments: 0,
    pendingMaintenances: 0,
    completedMaintenances: 0,
    activeCustomers: 0,
    underWarranty: 0,
    expiringSoon: 0,
  });
  const [recentMaintenances, setRecentMaintenances] = useState<any[]>([]);
  const [equipmentsWarranty, setEquipmentsWarranty] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar equipamentos
      const { data: equipments, error: equipmentsError } = await supabase
        .from('equipments')
        .select('*, customers(nome_empresa)')
        .eq('user_id', user.id);

      // Buscar manutenções (buscar todos os campos, incluindo relacionamentos)
      const { data: maintenances, error: maintenancesError } = await supabase
        .from('maintenances')
        .select(`
          *,
          equipments(
            nome,
            modelo,
            customer_id,
            customers(nome_empresa)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Buscar clientes
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);

      if (equipmentsError || maintenancesError || customersError) {
        console.error('Erro ao carregar dados:', equipmentsError || maintenancesError || customersError);
        return;
      }

      // Calcular estatísticas
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const equipmentsList = equipments || [];
      const maintenancesList = maintenances || [];
      const customersList = customers || [];

      // Debug: verificar quantas manutenções foram retornadas
      console.log('🔍 Debug Dashboard:');
      console.log('Total de manutenções retornadas:', maintenancesList.length);
      console.log('Detalhes das manutenções:', maintenancesList.map((m: any) => ({
        id: m.id,
        status: m.status,
        equipment_id: m.equipment_id,
        data_conclusao: m.data_conclusao,
        data_termino: m.data_termino
      })));

      const underWarranty = equipmentsList.filter((eq: any) => {
        if (!eq.garantia_validade) return false;
        const warrantyDate = new Date(eq.garantia_validade);
        return warrantyDate >= now;
      }).length;

      const expiringSoon = equipmentsList.filter((eq: any) => {
        if (!eq.garantia_validade) return false;
        const warrantyDate = new Date(eq.garantia_validade);
        return warrantyDate >= now && warrantyDate <= thirtyDaysFromNow;
      }).length;

      const pendingMaintenances = maintenancesList.filter((m: any) => 
        m.status === 'pendente' || m.status === 'em_andamento'
      ).length;

      const completedThisMonth = maintenancesList.filter((m: any) => {
        if (m.status !== 'concluida') return false;
        // Usar data_conclusao, data_termino ou updated_at como fallback
        const completedDate = m.data_conclusao 
          ? new Date(m.data_conclusao) 
          : m.data_termino 
          ? new Date(m.data_termino) 
          : m.updated_at 
          ? new Date(m.updated_at) 
          : null;
        if (!completedDate) return false;
        return completedDate.getMonth() === now.getMonth() && 
               completedDate.getFullYear() === now.getFullYear();
      }).length;

      // Debug: verificar contagens
      console.log('Manutenções pendentes:', pendingMaintenances);
      console.log('Manutenções concluídas este mês:', completedThisMonth);
      console.log('Manutenções concluídas (todas):', maintenancesList.filter((m: any) => m.status === 'concluida').length);

      // Calcular quantidade total de equipamentos (somar a quantidade de cada equipamento)
      const totalEquipmentsQuantity = equipmentsList.reduce((sum: number, eq: any) => {
        return sum + (eq.quantidade || 1); // Se não tiver quantidade, considera 1
      }, 0);

      setStats({
        totalEquipments: totalEquipmentsQuantity,
        pendingMaintenances,
        completedMaintenances: completedThisMonth,
        activeCustomers: customersList.length,
        underWarranty,
        expiringSoon,
      });

      // Configurar manutenções recentes (limitar a 3 mais recentes para exibição)
      const recentMaint = (maintenances || [])
        .slice(0, 3)
        .map((m: any) => ({
          id: m.numero_os || m.id,
          client: m.equipments?.customers?.nome_empresa || m.customers?.nome_empresa || 'Cliente',
          equipment: m.equipments?.nome || 'Equipamento',
          status: m.status === 'concluida' ? 'Concluído' : 
                  m.status === 'em_andamento' ? 'Em andamento' : 
                  m.status === 'pendente' ? 'Pendente' : 'Cancelada',
        }));
      setRecentMaintenances(recentMaint);

      // Configurar equipamentos em garantia
      const warrantyEquips = equipmentsList
        .filter((eq: any) => {
          if (!eq.garantia_validade) return false;
          const warrantyDate = new Date(eq.garantia_validade);
          return warrantyDate >= now;
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.garantia_validade).getTime();
          const dateB = new Date(b.garantia_validade).getTime();
          return dateA - dateB;
        })
        .slice(0, 3)
        .map((eq: any) => {
          const warrantyDate = new Date(eq.garantia_validade);
          const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            name: eq.nome,
            expires: `${daysUntilExpiry} dias`,
            daysUntilExpiry: daysUntilExpiry,
          };
        });
      setEquipmentsWarranty(warrantyEquips);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total de Equipamentos",
      value: stats.totalEquipments.toString(),
      icon: Package,
      description: "Equipamentos cadastrados",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Manutenções Pendentes",
      value: stats.pendingMaintenances.toString(),
      icon: AlertCircle,
      description: "Aguardando atendimento",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-400",
    },
    {
      title: "Manutenções Concluídas",
      value: stats.completedMaintenances.toString(),
      icon: Wrench,
      description: "Este mês",
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-400",
    },
    {
      title: "Clientes Ativos",
      value: stats.activeCustomers.toString(),
      icon: Users,
      description: "Total de clientes",
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      title: "Em Garantia",
      value: stats.underWarranty.toString(),
      icon: ShieldCheck,
      description: "Equipamentos cobertos",
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-400",
    },
    {
      title: "Expirando em Breve",
      value: stats.expiringSoon.toString(),
      icon: Clock,
      description: "Próximos 30 dias",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-400",
    },
  ];

  const quickActions = [
    {
      title: "Novo Equipamento",
      description: "Cadastrar equipamento",
      icon: Package,
      link: "/equipments",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Novo Cliente",
      description: "Cadastrar cliente",
      icon: Users,
      link: "/customers",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Registrar Manutenção",
      description: "Nova ordem de serviço",
      icon: Wrench,
      link: "/maintenance",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Relatórios",
      description: "Visualizar relatórios",
      icon: FileText,
      link: "/reports",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            Bem-vindo ao Sistema de Garantia Técnica
          </h2>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de gestão
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {statsCards.map((stat) => (
            <Card key={stat.title} className={`border-2 ${stat.borderColor} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {loading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Ações Rápidas</h3>
          <p className="text-sm text-muted-foreground mb-4">Acesso rápido às principais funcionalidades</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.link}>
              <Card className="cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <CardContent className="p-6">
                  <div className={`p-3 rounded-lg ${action.bgColor} w-fit mb-4`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{action.title}</h4>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Manutenções Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : recentMaintenances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma manutenção registrada ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMaintenances.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">OS #{item.id}</p>
                        <p className="text-sm text-muted-foreground">{item.client} - {item.equipment}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        item.status === "Concluído" 
                          ? "bg-green-100 text-green-600 border border-green-300" 
                          : item.status === "Em andamento"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Equipamentos em Garantia</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : equipmentsWarranty.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum equipamento em garantia no momento
                </div>
              ) : (
                <div className="space-y-4">
                  {equipmentsWarranty.map((item, idx) => {
                    // Determinar cor baseada nos dias restantes
                    let expiryColorClass = "";
                    if (item.daysUntilExpiry > 30) {
                      expiryColorClass = "text-green-600 font-semibold";
                    } else if (item.daysUntilExpiry > 0) {
                      expiryColorClass = "text-yellow-600 font-semibold";
                    } else {
                      expiryColorClass = "text-red-600 font-semibold";
                    }
                    
                    return (
                      <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-green-600 font-medium">Garantia válida</p>
                        </div>
                        <span className={`text-xs ${expiryColorClass}`}>
                          Vence em {item.expires}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
