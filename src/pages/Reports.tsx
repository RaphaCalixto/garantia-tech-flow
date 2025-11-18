import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, TrendingUp, Package, Users, Wrench } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [warrantyData, setWarrantyData] = useState<any[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar equipamentos
      const { data: equipmentsData } = await supabase
        .from('equipments')
        .select('*, customers(nome_empresa)')
        .eq('user_id', user.id);

      // Buscar manutenções
      const { data: maintenancesData } = await supabase
        .from('maintenances')
        .select('*, equipments(nome, customers(nome_empresa))')
        .eq('user_id', user.id);

      // Buscar clientes
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);

      setEquipments(equipmentsData || []);
      setMaintenances(maintenancesData || []);
      setCustomers(customersData || []);

      // Processar dados para gráficos
      processWarrantyData(equipmentsData || []);
      processMaintenanceData(maintenancesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWarrantyData = (equipmentsList: any[]) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let vencidas = 0;
    let pertoVencer = 0;
    let emGarantia = 0;

    equipmentsList.forEach((eq: any) => {
      if (!eq.garantia_validade) return;
      const warrantyDate = new Date(eq.garantia_validade);
      if (warrantyDate < now) {
        vencidas++;
      } else if (warrantyDate <= thirtyDaysFromNow) {
        pertoVencer++;
      } else {
        emGarantia++;
      }
    });

    setWarrantyData([
      { name: "Vencidas", value: vencidas, color: "#ef4444" },
      { name: "Perto de Vencer", value: pertoVencer, color: "#f59e0b" },
      { name: "Em Garantia", value: emGarantia, color: "#10b981" },
    ]);
  };

  const processMaintenanceData = (maintenancesList: any[]) => {
    const now = new Date();
    const last6Months: { [key: string]: number } = {};
    
    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      last6Months[monthKey] = 0;
    }

    // Contar manutenções por mês
    maintenancesList.forEach((m: any) => {
      const completedDate = m.data_conclusao 
        ? new Date(m.data_conclusao) 
        : m.data_termino 
        ? new Date(m.data_termino) 
        : m.updated_at 
        ? new Date(m.updated_at) 
        : null;
      
      if (completedDate && m.status === 'concluida') {
        const monthKey = completedDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        if (last6Months.hasOwnProperty(monthKey)) {
          last6Months[monthKey]++;
        }
      }
    });

    const chartData = Object.keys(last6Months).map(month => ({
      mes: month,
      quantidade: last6Months[month],
    }));

    setMaintenanceData(chartData);
  };

  const reports = [
    {
      title: "Relatório de Equipamentos",
      description: "Lista completa de todos os equipamentos cadastrados",
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
      type: "equipments",
    },
    {
      title: "Relatório de Manutenções",
      description: "Histórico de todas as manutenções realizadas",
      icon: Wrench,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
      type: "maintenances",
    },
    {
      title: "Relatório de Clientes",
      description: "Dados detalhados de todos os clientes",
      icon: Users,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      type: "customers",
    },
    {
      title: "Relatório de Garantias",
      description: "Status de garantias vencidas e vigentes",
      icon: TrendingUp,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      type: "warranties",
    },
  ];

  const exportToPDF = async (type: string) => {
    try {
      const doc = new jsPDF();
      let data: any[] = [];
      let headers: string[] = [];
      let title = "";

      switch (type) {
        case "equipments":
          title = "Relatório de Equipamentos";
          headers = ["Nome", "SKU/ID", "Modelo", "Cliente", "Localização", "Garantia"];
          data = equipments.map((eq: any) => [
            eq.nome || "-",
            eq.sku || eq.id || "-",
            eq.modelo || "-",
            eq.customers?.nome_empresa || "-",
            eq.localizacao || "-",
            eq.garantia_validade 
              ? new Date(eq.garantia_validade).toLocaleDateString('pt-BR')
              : "Sem garantia",
          ]);
          break;
        case "maintenances":
          title = "Relatório de Manutenções";
          headers = ["OS", "Equipamento", "Cliente", "Data Abertura", "Status", "Técnico"];
          data = maintenances.map((m: any) => [
            m.numero_os || m.id || "-",
            m.equipments?.nome || "-",
            m.equipments?.customers?.nome_empresa || "-",
            m.data_abertura 
              ? new Date(m.data_abertura).toLocaleDateString('pt-BR')
              : "-",
            m.status === 'concluida' ? 'Finalizado' : 
            m.status === 'pendente' ? 'Pendente' : 
            m.status === 'em_andamento' ? 'Em Andamento' : 'Cancelada',
            m.tecnico_responsavel || "-",
          ]);
          break;
        case "customers":
          title = "Relatório de Clientes";
          headers = ["Empresa", "CNPJ", "Contato", "Email", "Telefone", "Endereço"];
          data = customers.map((c: any) => [
            c.nome_empresa || "-",
            c.cnpj || "-",
            c.contato || "-",
            c.email || "-",
            c.telefone || "-",
            c.endereco || "-",
          ]);
          break;
        case "warranties":
          title = "Relatório de Garantias";
          headers = ["Equipamento", "SKU/ID", "Cliente", "Data Garantia", "Status"];
          const now = new Date();
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(now.getDate() + 30);
          data = equipments
            .filter((eq: any) => eq.garantia_validade)
            .map((eq: any) => {
              const warrantyDate = new Date(eq.garantia_validade);
              let status = "Em Garantia";
              if (warrantyDate < now) {
                status = "Vencida";
              } else if (warrantyDate <= thirtyDaysFromNow) {
                status = "Perto de Vencer";
              }
              return [
                eq.nome || "-",
                eq.sku || eq.id || "-",
                eq.customers?.nome_empresa || "-",
                new Date(eq.garantia_validade).toLocaleDateString('pt-BR'),
                status,
              ];
            });
          break;
      }

      // Verificar se há dados
      if (data.length === 0) {
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(12);
        doc.text("Nenhum dado disponível para este relatório.", 14, 40);
        doc.save(`${title.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast({
          title: "Relatório exportado!",
          description: `${title} exportado em PDF (sem dados).`,
        });
        return;
      }

      // Adicionar título
      doc.setFontSize(16);
      doc.text(title, 14, 20);
      
      // Adicionar data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

      // Adicionar tabela usando autoTable
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Salvar PDF
      doc.save(`${title.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Relatório exportado!",
        description: `${title} exportado em PDF com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Não foi possível gerar o arquivo PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = (type: string) => {
    let data: any[] = [];
    let title = "";

    switch (type) {
      case "equipments":
        title = "Relatório de Equipamentos";
        data = equipments.map((eq: any) => ({
          Nome: eq.nome || "-",
          "SKU/ID": eq.sku || eq.id || "-",
          Modelo: eq.modelo || "-",
          Cliente: eq.customers?.nome_empresa || "-",
          Localização: eq.localizacao || "-",
          Garantia: eq.garantia_validade 
            ? new Date(eq.garantia_validade).toLocaleDateString('pt-BR')
            : "Sem garantia",
          Quantidade: eq.quantidade || 1,
        }));
        break;
      case "maintenances":
        title = "Relatório de Manutenções";
        data = maintenances.map((m: any) => ({
          OS: m.numero_os || m.id || "-",
          Equipamento: m.equipments?.nome || "-",
          Cliente: m.equipments?.customers?.nome_empresa || "-",
          "Data Abertura": m.data_abertura 
            ? new Date(m.data_abertura).toLocaleDateString('pt-BR')
            : "-",
          "Data Término": m.data_termino 
            ? new Date(m.data_termino).toLocaleDateString('pt-BR')
            : "-",
          Status: m.status === 'concluida' ? 'Finalizado' : 
                  m.status === 'pendente' ? 'Pendente' : 
                  m.status === 'em_andamento' ? 'Em Andamento' : 'Cancelada',
          "Técnico Responsável": m.tecnico_responsavel || "-",
          Problema: m.problema || "-",
          Observações: m.observacoes || "-",
        }));
        break;
      case "customers":
        title = "Relatório de Clientes";
        data = customers.map((c: any) => ({
          Empresa: c.nome_empresa || "-",
          CNPJ: c.cnpj || "-",
          Contato: c.contato || "-",
          Email: c.email || "-",
          Telefone: c.telefone || "-",
          Endereço: c.endereco || "-",
        }));
        break;
      case "warranties":
        title = "Relatório de Garantias";
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        data = equipments
          .filter((eq: any) => eq.garantia_validade)
          .map((eq: any) => {
            const warrantyDate = new Date(eq.garantia_validade);
            let status = "Em Garantia";
            if (warrantyDate < now) {
              status = "Vencida";
            } else if (warrantyDate <= thirtyDaysFromNow) {
              status = "Perto de Vencer";
            }
            return {
              Equipamento: eq.nome || "-",
              "SKU/ID": eq.sku || eq.id || "-",
              Cliente: eq.customers?.nome_empresa || "-",
              "Data Garantia": new Date(eq.garantia_validade).toLocaleDateString('pt-BR'),
              Status: status,
            };
          });
        break;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `${title}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Relatório exportado!",
      description: `${title} exportado em Excel com sucesso.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Visualize e exporte relatórios do sistema</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Relatórios Disponíveis
          </h2>
          <p className="text-muted-foreground">
            Selecione o tipo de relatório que deseja visualizar ou exportar
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {reports.map((report) => (
            <Card key={report.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToPDF(report.type)}
                          className="w-full justify-start"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportToExcel(report.type)}
                          className="w-full justify-start"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Excel
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          {/* Gráfico de Pizza - Status de Garantias */}
          <Card>
            <CardHeader>
              <CardTitle>Status de Garantias</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={warrantyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {warrantyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [
                        `${value} (${(props.payload.percent * 100).toFixed(1)}%)`,
                        props.payload.name
                      ]}
                    />
                    <Legend 
                      formatter={(value, entry: any) => 
                        `${value}: ${entry.payload.value} (${(entry.payload.percent * 100).toFixed(0)}%)`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Manutenções Realizadas */}
          <Card>
            <CardHeader>
              <CardTitle>Manutenções Realizadas (Últimos 6 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={maintenanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantidade" fill="#3b82f6" name="Manutenções" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações sobre Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Formatos Disponíveis</h4>
                <p className="text-sm text-muted-foreground">
                  Os relatórios podem ser exportados nos formatos PDF, Excel (XLSX) e CSV.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Período de Dados</h4>
                <p className="text-sm text-muted-foreground">
                  Por padrão, os relatórios incluem dados dos últimos 12 meses. Você pode personalizar o período ao exportar.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Atualizações</h4>
                <p className="text-sm text-muted-foreground">
                  Os dados são atualizados em tempo real. Sempre que você exportar, terá as informações mais recentes do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
