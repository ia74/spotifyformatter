using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace injector
{
    public partial class GitBootstrap : Form
    {
        public GitBootstrap()
        {
            InitializeComponent();
        }
        String folder = System.Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);

        private void GitBootstrap_Load(object sender, EventArgs e)
        {
            WebClient wc = new WebClient();
            wc.DownloadFileTaskAsync("https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe", folder+"\\git-installer.exe");
            wc.DownloadProgressChanged += Wc_DownloadProgressChanged;
            wc.DownloadFileCompleted += Wc_DownloadFileCompleted;
        }

        private void Wc_DownloadFileCompleted(object? sender, AsyncCompletedEventArgs e)
        {
            label2.Text = "Please follow the git installer's instructions!";
            Process proc = new Process();
            proc.StartInfo.FileName = folder + "\\git-installer.exe";
            proc.EnableRaisingEvents = true;
            proc.Exited += Proc_Exited;
            proc.Start();
        }

        private void Proc_Exited(object? sender, EventArgs e)
        {
            Console.WriteLine("Git probably installed");
            this.Invoke((MethodInvoker)delegate
            {
                // close the form on the forms thread
                this.Close();
            });
        }

        private void Wc_DownloadProgressChanged(object sender, DownloadProgressChangedEventArgs e)
        {
            progressBar1.Value = e.ProgressPercentage;
        }
    }
}
