import { OutreachTemplate } from '../types';

export const INITIAL_TEMPLATES: OutreachTemplate[] = [
  {
    id: 'tmpl-audit-restaurant',
    name: 'Auditoría Móvil para Hostelería',
    category: 'Inicial',
    channel: 'Email en frío',
    primaryTone: 'consultivo',
    hookType: 'Auditoría de problema web detectado',
    description: 'Enfocado en menús en PDF ilegibles en móvil y lentitud de carga de reservas.',
    text: `Hola {{nombre}},

Revisando la web de {{empresa}} desde el móvil me ha llamado la atención vuestra propuesta gastronómica, pero he notado que el menú tarda unos 6 segundos en abrirse y está en un PDF que cuesta leer en pantallas pequeñas.

En hostelería, más del 78% de clientes busca la carta desde el smartphone antes de reservar. 

He grabado un vídeo de 2 minutos donde os muestro cómo adaptar vuestra carta interactiva y sistema de reserva directo para no perder comensales frente a agregadores. 

¿Te parecería bien que te pase el enlace por aquí sin ningún compromiso?`,
  },
  {
    id: 'tmpl-health-social-proof',
    name: 'Caso de Éxito en Clínicas Médicas',
    category: 'Inicial',
    channel: 'LinkedIn DM',
    primaryTone: 'orientado a beneficios',
    hookType: 'Caso de éxito / prueba social',
    description: 'Enfocado en captación de primeras visitas y reserva de citas médicas.',
    text: `Hola {{nombre}}, veo el gran trabajo que hacéis en {{empresa}} en el área de {{sector}}.

Hace poco terminamos el rediseño de la web de Clínica Dermatológica V., y simplemente simplificando el flujo de reserva de cita y modernizando la ficha de tratamientos aumentaron las peticiones de primera visita un +42% el primer trimestre.

Estuve echando un ojo a vuestra web actual y tenéis 2 puntos clave de fuga en el formulario móvil que son muy sencillos de resolver.

¿Te encaja que te comparta una captura con la comparativa y los puntos de mejora?`,
  },
  {
    id: 'tmpl-direct-ecommerce',
    name: 'Gancho Directo para E-commerce',
    category: 'Inicial',
    channel: 'Email en frío',
    primaryTone: 'directo',
    hookType: 'Auditoría de problema web detectado',
    description: 'Directo al grano para tiendas Shopify/WooCommerce con fugas de checkout.',
    text: `{{nombre}}, seré directo:

He analizado la velocidad del checkout de {{empresa}} con PageSpeed: puntuación 34/100 en móvil. Cada segundo extra en el carrito de una tienda online reduce un 7% las ventas completadas.

Desarrollamos tiendas a medida y optimizamos Shopify para que carguen en menos de 1.4s.

¿Tiene sentido que te prepare una auditoría técnica en PDF de 1 página con las 3 optimizaciones prioritarias para vuestra tienda?`,
  },
  {
    id: 'tmpl-followup-value',
    name: 'Seguimiento 1: Aporte de Valor (Sin presión)',
    category: 'Seguimiento',
    channel: 'Email en frío',
    primaryTone: 'cercano',
    hookType: 'Auditoría de problema web detectado',
    description: 'Seguimiento tras 3 días aportando un mockup visual o dato concreto.',
    text: `Hola {{nombre}},

Sé que estarás hasta arriba con la operativa de {{empresa}}. 

Para que no te quedes solo con palabras, he preparado un boceto rápido de cómo se vería la cabecera de vuestra web optimizada para captar reservas desde Instagram/Google.

Te dejo una captura adjunta. Si crees que puede aportaros valor, ¿te vendría bien ver una demo de 10 minutos este jueves o viernes?`,
  },
  {
    id: 'tmpl-followup-breakup',
    name: 'Seguimiento Final: Despedida Elegante (Breakup)',
    category: 'Reactiva',
    channel: 'Email en frío',
    primaryTone: 'profesional',
    hookType: 'Pregunta de cualificación',
    description: 'Cierra el ciclo educadamente y suele reactivar un 18-25% de respuestas.',
    text: `Hola {{nombre}},

Te escribo por última vez para no resultar pesado. Deduzco por tu silencio que modernizar la web de {{empresa}} no es una prioridad ahora mismo, lo cual comprendo perfectamente.

Cierro vuestro expediente por mi parte. Si más adelante queréis renovar diseño o mejorar las conversiones, estaré encantado de ayudaros.

¡Mucho éxito con los proyectos de este año!`,
  },
  {
    id: 'tmpl-objection-price',
    name: 'Manejo de Objeción: Precio / Presupuesto',
    category: 'Objeciones',
    channel: 'Email en frío',
    primaryTone: 'consultivo',
    hookType: 'Propuesta directa',
    description: 'Propuesta modular reducida para no perder el cliente por coste inicial.',
    text: `Hola {{nombre}},

Entiendo 100% que el presupuesto completo de desarrollo sea una inversión que queráis sopesar con calma en {{empresa}}.

Para que no dejéis pasar la oportunidad de resolver la captación móvil este trimestre, ¿tendría sentido plantear una Fase 1 modular centrada únicamente en la landing principal de servicios por una tercera parte del importe?

Así probamos resultados y medís el retorno antes de abordar el resto del portal. ¿Lo comentamos brevemente?`,
  },
  {
    id: 'tmpl-zh-redbook-food',
    name: '小红书 Redbook: 谦逊礼貌 + 餐饮扫码点餐',
    category: 'Inicial',
    channel: 'Redbook (小红书)',
    primaryTone: '谦逊礼貌 (Humble & Polite)',
    hookType: 'Auditoría de problema web detectado (Carta móvil / Carga)',
    description: 'Cortesía y respeto al honor (面子), señalando con tacto carta en PDF y ofreciendo demo.',
    text: `王总您好，冒昧打扰！关注到你们家{{empresa}}在小红书口碑非常棒，菜品看着特别有食欲！

但是在手机端看菜单时发现是图片PDF，加载较慢且文字在手机上有些看不清。

现在海外餐饮超过80%客人进店前会先用手机看招牌菜。我们专门为海外华人中餐厅做多语言交互式扫码点餐与独立官网，不仅省心省力，还能帮您摆脱外卖平台高额抽成。

我录了一个2分钟演示视频，如果您有兴趣了解，我发您看一下，顺祝生意兴隆！`,
  },
  {
    id: 'tmpl-zh-wechat-guanxi',
    name: '微信 WeChat: 建立关系 + 熟人同胞信任',
    category: 'Inicial',
    channel: 'WeChat (微信)',
    primaryTone: '建立关系 (Guanxi & Trust)',
    hookType: 'Referido / Confianza comunitaria (熟人与同胞推荐)',
    description: 'Apela a la comunidad china en ultramar y referencia mutua sin presión comercial.',
    text: `李总您好，我是做独立站和数字化系统的Alex，也是经由马德里餐饮同胞张哥介绍加您的！

在海外做实体餐饮大家都不容易，看到您家{{empresa}}生意越做越大，真心敬佩！

张哥店里换上我们新做的手机端订座和双语菜单后，周末预订翻了一倍，而且客人直接官网订座，一分钱第三方佣金不用交。

抽空咱们交流一下，我把同行做好的案例页面发您瞧瞧，给您多一个省成本的参考！`,
  },
  {
    id: 'tmpl-zh-pragmatic-roi',
    name: '微信/WhatsApp: 务实真诚 + 降本增效 (算笔账)',
    category: 'Seguimiento',
    channel: 'WeChat (微信)',
    primaryTone: '务实真诚 (Pragmatic & ROI)',
    hookType: 'Caso de éxito / prueba social con negocios similares',
    description: 'Enfoque directo en números, ahorro de comisiones a agregadores y aumento de margen.',
    text: `陈老板您好！知道您最近在店里忙，直奔主题给您算笔明白账：

现在用第三方外卖或订座平台，每个月抽成至少15%~25%，一年下来就是上万欧元的纯利润被平台扣掉。

我们帮巴塞罗那3家同行落地了专属多语言外卖与扫码点餐系统，一次性开发，之后所有订单0抽成，平均两个月就能把系统费用赚回来。

如果您想给店里省心省钱，我把功能清单和演示链接发您，您随时查阅！`,
  },
  {
    id: 'tmpl-zh-objection-cost',
    name: '微信 Objeción Coste: 务实真诚 + 试点保障',
    category: 'Objeciones',
    channel: 'WeChat (微信)',
    primaryTone: '务实真诚 (Pragmatic & ROI)',
    hookType: 'Propuesta directa de colaboración',
    description: 'Reduce la resistencia al precio con una fase piloto modular de bajo riesgo.',
    text: `林总您好，非常理解您对前期预算的顾虑，做生意讲究实实在在算投资回报。

这样，咱们不急着做一整套大系统，先上一套单页版手机扫码电子菜单与Google地图引流页面，费用只要原本的1/3。

先让您店里的客人扫码用起来，看到单量和好评真实提升了，咱们再决定是否扩展全功能。您看这样是否更踏实省心？`,
  }
];
