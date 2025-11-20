import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, Search, Edit, Check, ChevronsUpDown, Building2, QrCode, Download, Printer, Eye, ArrowRight, ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Equipments = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [openCustomerSelect, setOpenCustomerSelect] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [editingEquipment, setEditingEquipment] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedEquipmentForQR, setSelectedEquipmentForQR] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedEquipmentForHistory, setSelectedEquipmentForHistory] = useState<any>(null);
  const [equipmentHistory, setEquipmentHistory] = useState<any[]>([]);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('saida');
  const [movementCustomerId, setMovementCustomerId] = useState<string>("");
  const [openMovementCustomerSelect, setOpenMovementCustomerSelect] = useState(false);
  const [movementObservacoes, setMovementObservacoes] = useState("");
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    numero_serie: "",
    sku: "",
    customer_id: "",
    modelo: "",
    localizacao: "",
    garantia_validade: "",
    quantidade: "1",
  });

  useEffect(() => {
    if (user) {
      loadEquipments();
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;

    try {
      const { data: customersData, error } = await supabase
        .from('customers')
        .select('id, nome_empresa')
        .eq('user_id', user.id)
        .order('nome_empresa', { ascending: true });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        return;
      }

      setCustomers(customersData || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadEquipments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipments')
        .select('*, customers(nome_empresa)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar equipamentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os equipamentos.",
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const equipmentsList = (data || []).map((eq: any) => {
        let warranty = "Sem garantia";
        let warrantyStatus = "none";
        
        if (eq.garantia_validade) {
          const warrantyDate = new Date(eq.garantia_validade);
          if (warrantyDate < now) {
            warranty = "Garantia Vencida";
            warrantyStatus = "expired";
          } else if (warrantyDate <= thirtyDaysFromNow) {
            const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            warranty = `Expira em ${daysUntilExpiry} dias`;
            warrantyStatus = "expiring";
          } else {
            warranty = "Garantia Válida";
            warrantyStatus = "valid";
          }
        }

        return {
          id: eq.id,
          name: eq.nome,
          serial: eq.numero_serie || '',
          sku: eq.sku || '',
          customer: eq.customers?.nome_empresa || 'Minha empresa',
          customer_id: eq.customer_id || null,
          model: eq.modelo || '',
          warranty,
          warrantyStatus,
          location: eq.localizacao || '',
          garantia_validade: eq.garantia_validade || '',
          quantidade: eq.quantidade || 1,
        };
      });

      setEquipments(equipmentsList);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipments = equipments.filter(eq =>
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment.id);
    setFormData({
      nome: equipment.name || "",
      numero_serie: equipment.serial || "",
      sku: equipment.sku || "",
      customer_id: equipment.customer_id || "",
      modelo: equipment.model || "",
      localizacao: equipment.location || "",
      garantia_validade: equipment.garantia_validade ? equipment.garantia_validade.split('T')[0] : "",
      quantidade: equipment.quantidade?.toString() || "1",
    });
    setSelectedCustomerId(equipment.customer_id || "");
    setShowForm(true);
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEquipment(null);
    setFormData({
      nome: "",
      numero_serie: "",
      sku: "",
      customer_id: "",
      modelo: "",
      localizacao: "",
      garantia_validade: "",
      quantidade: "1",
    });
    setSelectedCustomerId("");
  };

  const handleShowQRCode = (equipment: any) => {
    setSelectedEquipmentForQR(equipment);
    setShowQRCode(true);
  };

  const handleDownloadQRCode = () => {
    if (!selectedEquipmentForQR) return;

    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QRCode-${selectedEquipmentForQR.sku || selectedEquipmentForQR.id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQRCode = () => {
    window.print();
  };

  const downloadEquipmentTemplate = () => {
    const templateData = [
      {
        'Nome do Equipamento': 'Notebook Dell Inspiron',
        'SKU/ID': 'EQ-ABC123',
        'Número de Série': 'SN123456',
        'Modelo': 'Inspiron 15',
        'Quantidade': '1',
        'Localização': 'Escritório Principal',
        'Validade da Garantia': '2025-12-31',
        'Cliente (Nome da Empresa)': 'TechCorp Ltda'
      },
      {
        'Nome do Equipamento': 'Impressora HP LaserJet',
        'SKU/ID': '',
        'Número de Série': 'SN789012',
        'Modelo': 'LaserJet Pro',
        'Quantidade': '2',
        'Localização': 'Sala de Reuniões',
        'Validade da Garantia': '2026-06-30',
        'Cliente (Nome da Empresa)': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos');
    XLSX.writeFile(wb, 'template_equipamentos.xlsx');

    toast({
      title: "Template baixado!",
      description: "Preencha o template com seus dados e importe novamente.",
    });
    setShowImportInstructions(true);
  };

  const handleImportEquipments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para importar equipamentos.",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        toast({
          title: "Erro",
          description: "O arquivo Excel está vazio.",
          variant: "destructive",
        });
        return;
      }

      // Mapear campos do Excel para o formato do banco
      const equipmentsToInsert = [];
      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        try {
          const nome = row['Nome do Equipamento'] || row['nome_equipamento'] || row['Nome'] || '';
          if (!nome) {
            errorCount++;
            continue;
          }

          // Buscar cliente pelo nome se fornecido
          let customerId = null;
          const clienteNome = row['Cliente (Nome da Empresa)'] || row['cliente'] || row['Cliente'] || '';
          if (clienteNome) {
            const customer = customers.find(c => 
              c.nome_empresa.toLowerCase() === clienteNome.toLowerCase()
            );
            if (customer) {
              customerId = customer.id;
            }
          }

          // Gerar SKU se não fornecido
          let sku = row['SKU/ID'] || row['sku'] || row['SKU'] || null;
          if (!sku) {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            sku = `EQ-${timestamp}-${random}`;
          }

          equipmentsToInsert.push({
            user_id: user.id,
            customer_id: customerId,
            nome: nome,
            numero_serie: row['Número de Série'] || row['numero_serie'] || row['Número de Serie'] || null,
            sku: sku,
            modelo: row['Modelo'] || row['modelo'] || null,
            localizacao: row['Localização'] || row['localizacao'] || row['Localizacao'] || null,
            garantia_validade: row['Validade da Garantia'] || row['validade_garantia'] || row['Garantia'] || null,
            quantidade: parseInt(row['Quantidade'] || row['quantidade'] || '1') || 1,
          });

          successCount++;
        } catch (error) {
          console.error('Erro ao processar linha:', error);
          errorCount++;
        }
      }

      if (equipmentsToInsert.length > 0) {
        const { error } = await supabase
          .from('equipments')
          .insert(equipmentsToInsert);

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Importação concluída!",
        description: `${successCount} equipamento(s) importado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s) encontrado(s).` : ''}`,
      });

      await loadEquipments();
    } catch (error: any) {
      console.error('Erro ao importar equipamentos:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar os equipamentos. Verifique o formato do arquivo.",
        variant: "destructive",
      });
    }

    // Limpar input
    event.target.value = '';
  };

  const handleShowHistory = async (equipment: any) => {
    setSelectedEquipmentForHistory(equipment);
    setShowHistory(true);
    await loadEquipmentHistory(equipment.id);
  };

  const loadEquipmentHistory = async (equipmentId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('equipment_history')
        .select(`
          *,
          customers(nome_empresa)
        `)
        .eq('equipment_id', equipmentId)
        .eq('user_id', user.id)
        .order('data_movimentacao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico.",
          variant: "destructive",
        });
        return;
      }

      setEquipmentHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleOpenMovementForm = (equipment: any, type: 'entrada' | 'saida') => {
    setSelectedEquipmentForHistory(equipment);
    setMovementType(type);
    setMovementCustomerId("");
    setMovementObservacoes("");
    setShowMovementForm(true);
  };

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEquipmentForHistory) return;

    if (movementType === 'saida' && !movementCustomerId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para registrar a saída.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('equipment_history')
        .insert({
          equipment_id: selectedEquipmentForHistory.id,
          user_id: user.id,
          tipo_movimentacao: movementType,
          cliente_id: movementCustomerId || null,
          observacoes: movementObservacoes || null,
        });

      if (error) {
        console.error('Erro ao registrar movimentação:', error);
        toast({
          title: "Erro",
          description: "Não foi possível registrar a movimentação.",
          variant: "destructive",
        });
        return;
      }

      // Se for saída, atualizar o cliente do equipamento
      if (movementType === 'saida' && movementCustomerId) {
        await supabase
          .from('equipments')
          .update({ customer_id: movementCustomerId })
          .eq('id', selectedEquipmentForHistory.id)
          .eq('user_id', user.id);
      } else if (movementType === 'entrada') {
        // Se for entrada, remover o cliente (volta para a empresa)
        await supabase
          .from('equipments')
          .update({ customer_id: null })
          .eq('id', selectedEquipmentForHistory.id)
          .eq('user_id', user.id);
      }

      toast({
        title: "Movimentação registrada!",
        description: `A ${movementType === 'entrada' ? 'entrada' : 'saída'} foi registrada com sucesso.`,
      });

      setShowMovementForm(false);
      setMovementCustomerId("");
      setMovementObservacoes("");
      await loadEquipmentHistory(selectedEquipmentForHistory.id);
      await loadEquipments();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a movimentação.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para cadastrar equipamentos.",
        variant: "destructive",
      });
      return;
    }

    // Cliente não é mais obrigatório - pode ser da empresa

    try {
      if (editingEquipment) {
        // Atualizar equipamento existente
        const { error } = await supabase
          .from('equipments')
          .update({
            customer_id: formData.customer_id || null,
            nome: formData.nome,
            numero_serie: formData.numero_serie || null,
            sku: formData.sku || null,
            modelo: formData.modelo || null,
            localizacao: formData.localizacao || null,
            garantia_validade: formData.garantia_validade || null,
            quantidade: parseInt(formData.quantidade) || 1,
          })
          .eq('id', editingEquipment)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao atualizar equipamento:', error);
          toast({
            title: "Erro ao atualizar",
            description: error.message || "Não foi possível atualizar o equipamento.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Equipamento atualizado!",
          description: "As informações do equipamento foram atualizadas com sucesso.",
        });
      } else {
        // Criar novo equipamento
        // Gerar SKU automático se não fornecido
        let skuValue = formData.sku?.trim() || null;
        if (!skuValue) {
          // Gerar SKU baseado no timestamp + random
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          skuValue = `EQ-${timestamp}-${random}`;
        }

        const { data: insertedData, error } = await supabase
          .from('equipments')
          .insert({
            user_id: user.id,
            customer_id: formData.customer_id || null,
            nome: formData.nome,
            numero_serie: formData.numero_serie || null,
            sku: skuValue,
            modelo: formData.modelo || null,
            localizacao: formData.localizacao || null,
            garantia_validade: formData.garantia_validade || null,
            quantidade: parseInt(formData.quantidade) || 1,
          })
          .select()
          .single();

        // Se houver erro de SKU duplicado, tentar novamente com outro SKU
        if (error) {
          if (error.code === '23505' && error.message.includes('sku')) {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            const newSku = `EQ-${timestamp}-${random}`;
            
            const { error: retryError } = await supabase
              .from('equipments')
              .insert({
                user_id: user.id,
                customer_id: formData.customer_id || null,
                nome: formData.nome,
                numero_serie: formData.numero_serie || null,
                sku: newSku,
                modelo: formData.modelo || null,
                localizacao: formData.localizacao || null,
                garantia_validade: formData.garantia_validade || null,
                quantidade: parseInt(formData.quantidade) || 1,
              });
            
            if (retryError) {
              console.error('Erro ao cadastrar equipamento:', retryError);
              toast({
                title: "Erro ao cadastrar",
                description: retryError.message || "Não foi possível cadastrar o equipamento.",
                variant: "destructive",
              });
              return;
            }
          } else {
            console.error('Erro ao cadastrar equipamento:', error);
            toast({
              title: "Erro ao cadastrar",
              description: error.message || "Não foi possível cadastrar o equipamento.",
              variant: "destructive",
            });
            return;
          }
        }

        toast({
          title: "Equipamento cadastrado!",
          description: "O equipamento foi adicionado com sucesso.",
        });
      }

      // Limpar formulário
      setFormData({
        nome: "",
        numero_serie: "",
        sku: "",
        customer_id: "",
        modelo: "",
        localizacao: "",
        garantia_validade: "",
        quantidade: "1",
      });
      setSelectedCustomerId("");
      setEditingEquipment(null);
      setShowForm(false);

      // Recarregar lista de equipamentos
      await loadEquipments();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o equipamento.",
        variant: "destructive",
      });
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const getWarrantyBadgeClass = (status: string) => {
    switch (status) {
      case "expired":
        return "bg-red-100 text-red-600 border border-red-300";
      case "expiring":
        return "bg-yellow-100 text-yellow-600 border border-yellow-300";
      case "valid":
        return "bg-green-100 text-green-600 border border-green-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Equipamentos</h1>
              <p className="text-sm text-muted-foreground">Gerencie todos os equipamentos e suas garantias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={downloadEquipmentTemplate}
              className="rounded-full"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
            <label htmlFor="import-equipments" className="cursor-pointer">
              <Button
                variant="outline"
                className="rounded-full"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Excel
                </span>
              </Button>
              <input
                id="import-equipments"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportEquipments}
                className="hidden"
              />
            </label>
            <Button onClick={() => setShowForm(!showForm)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Novo Equipamento
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingEquipment ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Equipamento</Label>
                    <Input 
                      id="name" 
                      placeholder="Ex: Notebook Dell Inspiron" 
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial">Número de Série</Label>
                    <Input 
                      id="serial" 
                      placeholder="SN123456" 
                      value={formData.numero_serie}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU/ID (deixe em branco para gerar automaticamente)</Label>
                    <Input 
                      id="sku" 
                      placeholder="EQ-ABC123 ou deixe em branco" 
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer">Cliente (opcional - deixe vazio para equipamento da empresa)</Label>
                    <Popover open={openCustomerSelect} onOpenChange={setOpenCustomerSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCustomerSelect}
                          className="w-full justify-between"
                        >
                          {selectedCustomer
                            ? selectedCustomer.nome_empresa
                            : "Minha empresa"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="empresa"
                                onSelect={() => {
                                  setSelectedCustomerId("");
                                  setFormData(prev => ({ ...prev, customer_id: "" }));
                                  setOpenCustomerSelect(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !selectedCustomerId ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <Building2 className="mr-2 h-4 w-4" />
                                <span className="italic">Minha empresa</span>
                              </CommandItem>
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.nome_empresa}
                                  onSelect={() => {
                                    setSelectedCustomerId(customer.id);
                                    setFormData(prev => ({ ...prev, customer_id: customer.id }));
                                    setOpenCustomerSelect(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <Building2 className="mr-2 h-4 w-4" />
                                  {customer.nome_empresa}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input 
                      id="model" 
                      placeholder="Modelo do equipamento" 
                      value={formData.modelo}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input 
                      id="location" 
                      placeholder="Local onde está instalado" 
                      value={formData.localizacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input 
                      id="quantidade" 
                      type="number" 
                      min="1"
                      placeholder="1" 
                      value={formData.quantidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Validade da Garantia</Label>
                    <Input 
                      id="warranty" 
                      type="date" 
                      value={formData.garantia_validade}
                      onChange={(e) => setFormData(prev => ({ ...prev, garantia_validade: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingEquipment ? "Atualizar" : "Cadastrar"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Equipamentos</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {equipments.length} {equipments.length === 1 ? 'equipamento cadastrado' : 'equipamentos cadastrados'}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipamentos..."
                  className="w-64 border-0 bg-transparent focus-visible:ring-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : filteredEquipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado ainda'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">ID/SKU</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Equipamento</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Cliente</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Modelo</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Quantidade</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Status da Garantia</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Localização</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipments.map((equipment) => (
                    <tr key={equipment.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span className="font-medium text-foreground">{equipment.sku || equipment.id}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{equipment.name}</p>
                            <p className="text-xs text-muted-foreground">{equipment.serial}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-foreground">
                        {equipment.customer_id ? equipment.customer : (
                          <span className="text-muted-foreground italic">Minha empresa</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{equipment.model}</td>
                      <td className="p-3 text-foreground font-medium">{equipment.quantidade || 1}</td>
                      <td className="p-3">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getWarrantyBadgeClass(equipment.warrantyStatus)}`}>
                          {equipment.warranty}
                        </span>
                      </td>
                      <td className="p-3 text-foreground">{equipment.location}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleShowHistory(equipment)}
                            title="Ver histórico"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleShowQRCode(equipment)}
                            title="Gerar QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(equipment)}
                            title="Editar equipamento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para exibir QR Code */}
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code do Equipamento</DialogTitle>
              <DialogDescription>
                Escaneie este QR code para acessar as informações do equipamento. Você pode imprimir ou baixar a imagem.
              </DialogDescription>
            </DialogHeader>
            {selectedEquipmentForQR && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={selectedEquipmentForQR.sku || selectedEquipmentForQR.id}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{selectedEquipmentForQR.name}</p>
                  <p className="text-sm text-muted-foreground">SKU/ID: {selectedEquipmentForQR.sku || selectedEquipmentForQR.id}</p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadQRCode}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handlePrintQRCode}
                    className="flex-1"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para exibir histórico */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Movimentações</DialogTitle>
              <DialogDescription>
                Histórico completo de entrada e saída do equipamento
              </DialogDescription>
            </DialogHeader>
            {selectedEquipmentForHistory && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold text-lg">{selectedEquipmentForHistory.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {selectedEquipmentForHistory.sku || selectedEquipmentForHistory.id}</p>
                </div>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenMovementForm(selectedEquipmentForHistory, 'saida')}
                    className="flex-1"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Registrar Saída
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenMovementForm(selectedEquipmentForHistory, 'entrada')}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Registrar Entrada
                  </Button>
                </div>
                {equipmentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação registrada ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {equipmentHistory.map((movement) => (
                      <div
                        key={movement.id}
                        className={`p-4 rounded-lg border ${
                          movement.tipo_movimentacao === 'saida'
                            ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                            : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {movement.tipo_movimentacao === 'saida' ? (
                              <ArrowRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                            ) : (
                              <ArrowLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                            <span className={`font-semibold ${
                              movement.tipo_movimentacao === 'saida'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {movement.tipo_movimentacao === 'saida' ? 'Saída' : 'Entrada'}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(movement.data_movimentacao).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {movement.customers && (
                          <p className="text-sm text-foreground mb-1">
                            Cliente: <span className="font-medium">{movement.customers.nome_empresa}</span>
                          </p>
                        )}
                        {movement.observacoes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {movement.observacoes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog para registrar movimentação */}
        <Dialog open={showMovementForm} onOpenChange={setShowMovementForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Registrar {movementType === 'saida' ? 'Saída' : 'Entrada'} de Equipamento
              </DialogTitle>
              <DialogDescription>
                {movementType === 'saida' 
                  ? 'Registre quando o equipamento for vendido ou entregue a um cliente.'
                  : 'Registre quando o equipamento retornar à empresa.'}
              </DialogDescription>
            </DialogHeader>
            {selectedEquipmentForHistory && (
              <form onSubmit={handleRegisterMovement} className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-semibold">{selectedEquipmentForHistory.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {selectedEquipmentForHistory.sku || selectedEquipmentForHistory.id}</p>
                </div>
                {movementType === 'saida' && (
                  <div className="space-y-2">
                    <Label htmlFor="movement-customer">Cliente (obrigatório para saída)</Label>
                    <Popover open={openMovementCustomerSelect} onOpenChange={setOpenMovementCustomerSelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openMovementCustomerSelect}
                          className="w-full justify-between"
                        >
                          {movementCustomerId
                            ? customers.find(c => c.id === movementCustomerId)?.nome_empresa
                            : "Selecione um cliente..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.nome_empresa}
                                  onSelect={() => {
                                    setMovementCustomerId(customer.id);
                                    setOpenMovementCustomerSelect(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      movementCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <Building2 className="mr-2 h-4 w-4" />
                                  {customer.nome_empresa}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="movement-observacoes">Observações (opcional)</Label>
                  <textarea
                    id="movement-observacoes"
                    value={movementObservacoes}
                    onChange={(e) => setMovementObservacoes(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Ex: Venda realizada, equipamento entregue, etc."
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Registrar {movementType === 'saida' ? 'Saída' : 'Entrada'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMovementForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de instruções de importação */}
        <Dialog open={showImportInstructions} onOpenChange={setShowImportInstructions}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Instruções para Importação de Equipamentos</DialogTitle>
              <DialogDescription>
                Para importar equipamentos via Excel, os campos precisam estar exatamente como no template.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Campos obrigatórios no Excel:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>Nome do Equipamento</strong> - Obrigatório</li>
                  <li><strong>SKU/ID</strong> - Opcional (será gerado automaticamente se vazio)</li>
                  <li><strong>Número de Série</strong> - Opcional</li>
                  <li><strong>Modelo</strong> - Opcional</li>
                  <li><strong>Quantidade</strong> - Opcional (padrão: 1)</li>
                  <li><strong>Localização</strong> - Opcional</li>
                  <li><strong>Validade da Garantia</strong> - Opcional (formato: YYYY-MM-DD)</li>
                  <li><strong>Cliente (Nome da Empresa)</strong> - Opcional (deixe vazio para "Minha empresa")</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Dica:</strong> Copie os dados do seu Excel atual e cole no template baixado, mantendo os nomes das colunas exatamente como estão. 
                  O nome do cliente deve corresponder exatamente ao nome cadastrado no sistema.
                </p>
              </div>
              <Button onClick={() => setShowImportInstructions(false)} className="w-full">
                Entendi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Equipments;
