import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';

import {
  ICommandPalette, 
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

import {Widget} from '@lumino/widgets';

interface APODResponse{
  copyright: string;
  date: string;
  explanation: string;
  media_type:'video' | 'image';
  title: string;
  url: string;
}

class APODWidget extends Widget{
  /** 
   * constructs a new widget.
   */
  constructor(){
    super();

    this.addClass('my-apodWidget');
    this.img = document.createElement('img');
    this.node.appendChild(this.img);

    this.summary = document.createElement('p');
    this.node.appendChild(this.summary);
  }

  readonly img: HTMLImageElement;
  readonly summary: HTMLParagraphElement;

  async updateAPODImage():Promise<void>{
    //fetch info about a random picture
    const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${this.randomDate()}`);
    
    if (!response.ok){
      const data = await response.json();
      if (data.error){
        this.summary.innerText = data.error.message;
      } else {
        this.summary.innerText = response.statusText;
      }
      return;
    }

    const data = await response.json() as APODResponse;

    if (data.media_type === 'image') {
      this.img.src = data.url;
      this.img.title = data.title;
      this.summary.innerText = data.title;
      if (data.copyright) {
        this.summary.innerText += ` (Copyright: ${data.copyright})`;
      }
    } else {
      this.summary.innerText = 'Random APOD fetched was not an image. ';
    }
  }

  // Get a random date string in YYYY-MM-DD format
  randomDate():string {
    const start = new Date(2010,1,1);
    const end = new Date();
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString().slice(0, 10);
  }
}

function activate(app: JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer | null){
  console.log('JupyterLab extension jupyterlab_apod is activated!');

  let widget: MainAreaWidget<APODWidget>;

  // command to open the widget
  const command: string = 'apod:open';
  app.commands.addCommand(command, {
    label: 'Random Astronomy Picture',
    execute: () => {
      if (!widget || widget.isDisposed){
      const content = new APODWidget();
      widget = new MainAreaWidget({content});
      widget.id = 'apod-jupyterlab';
      widget.title.label = 'Astronomy Picture';
      widget.title.closable = true;
      }
      if (!tracker.has(widget)) {
        tracker.add(widget);
      }
      if (!widget.isAttached) {
        app.shell.add(widget, 'main');
      }
      widget.content.updateAPODImage();

      app.shell.activateById(widget.id);
    }
  })

  // add the command to the palette
  palette.addItem({command, category: 'Tutorial'});

  // track the widget
  let tracker = new WidgetTracker<MainAreaWidget<APODWidget>>({
    namespace: 'apod'
  });
  if (restorer){
    restorer.restore(tracker,{
      command,
      name: () => 'apod'
    })
  }
}

/**
 * Initialization data for the jupyterlab_apod extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_apod',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILayoutRestorer],
  activate: activate
}

export default plugin;
