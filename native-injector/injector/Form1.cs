using System.Windows.Forms;

namespace injector
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void textBox2_TextChanged(object sender, EventArgs e)
        {

        }



        private void Form1_Load(object sender, EventArgs e)
        {
            string homedir = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            textBox1.Text = homedir + "\\Spotify\\Apps\\xpui.spa";
            textBox2.Text = homedir + "\\SpotifyFormatter";
        }

        private void button1_Click(object sender, EventArgs e)
        {
            if (!Directory.Exists("C:\\Program Files\\Git\\bin"))
            {
                GitBootstrap bs = new GitBootstrap();
                bs.ShowDialog();
            }
        }
    }
}
