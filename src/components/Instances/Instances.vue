<template>
  <v-container grid-list-md>
    <order-create></order-create>
  <v-card>
    <v-card-title>
      <v-btn
              absolute
              dark
              fab
              top
              right
              small
              color="blue"
              @click="refreshData"
            >
              <v-icon>refresh</v-icon>
            </v-btn>
      <v-btn color="primary" dark @click="$store.dispatch('openInstanceCreateDialog')" class="mb-1">{{ $t('instances.actions.new') }}</v-btn>
      <v-spacer></v-spacer>
      <v-text-field
        append-icon="search"
        :label="$t('actions.search')"
        single-line
        hide-details
        v-model="search"
      ></v-text-field>
    </v-card-title>
    <v-data-table
      v-if="items"
      :headers="computedHeaders"
      :items="items"
      :search="search">
      <template v-slot:item.ips[0].address="{ item }">
        <v-span v-if="item.ips[0]">{{ filterIpv6(item.ips[0]) }}</v-span>
      </template>
      <template v-slot:item.ips[1].address="{ item }">
        <v-span v-if="item.ips[1]">{{ filterIpv6(item.ips[1]) }}</v-span>
      </template>
      <template v-slot:item.action="{ item }">
        <v-btn color="primary" small left :to="'/instance/'+item.id">{{ $t('instances.actions.manage') }}</v-btn>
      </template>
      <template v-slot:item.status="{ item }">
        <v-icon :color="colorstate(item.status)">{{ iconstate(item.status) }}</v-icon>
      </template>
    </v-data-table>
  </v-card>
  </v-container>
</template>

<script>
  import OrderCreate from '../../components/Order/OrderCreate';

  export default {
    name: 'Instances',
    components: {
      'order-create': OrderCreate
    },
    data() {
      return {
        search: '',
        pagination: {
          sortBy: 'name',
          rowsPerPage: 15
        },
        dialog: false,
        dialogDelete: false,
        headers: [
          {
            text: this.$t('actions.name'),
            align: 'left',
            value: 'action',
            class: 'pl-4',
            sortable: false
          },
          {
            text: this.$t('stats.status'),
            align: 'left',
            value: 'status',
            class: 'pl-0',
            sortable: false
          },
          {
            text: this.$t('stats.name'),
            align: 'left',
            value: 'name',
            class: 'pa-1'
          },
          {
            text: `${this.$tc('stats.cpu', 1)}·s`,
            align: 'left',
            value: 'config.limits_cpu',
            sortable: false,
            class: 'pa-1'
          },
          {
            text: this.$t('stats.memory_limit'),
            align: 'left',
            value: 'config.limits_memory',
            class: 'pa-1'
          },
          {
            text: this.$t('stats.disk_limit'),
            align: 'left',
            value: 'config.limits_disk',
            disk: false,
            class: 'pa-1'
          },
          {
            text: 'IPv4',
            align: 'left',
            value: 'ips[0].address',
            sortable: false,
            class: 'pa-1'
          },
          {
            text: 'IPv6',
            align: 'left',
            value: 'ips[1].address',
            sortable: false,
            class: 'pa-1'
          },
          {
            text: 'Price €',
            align: 'left',
            value: 'config.user_price',
            sortable: true,
            price: false,
            class: 'pa-1'
          },
          {
            text: 'Type',
            align: 'left',
            value: 'type',
            sortable: true,
            type: false,
            class: 'pa-1'
          }
        ],
        editedIndex: -1,
        editedItem: {
          name: '',
          os: '',
          cpu: '',
          memory: '',
          disk: ''
        },
        defaultItem: {
          name: '',
          os: 'ubuntu-16.04',
          cpu: '1',
          memory: '512',
          disk: '10'
        },
        hasCreated: false,
        name: '',
        os: 'ubuntu-16.04',
        cpu: '1',
        memory: '512',
        disk: '10',
        templates: [
          { text: 'Ubuntu 16.04', value: 'ubuntu/16.04' },
          { text: 'Debian 9', value: 'debian/9' },
          { text: 'CentOS 7', value: 'centos/7' },
          { text: 'Fedora 29', value: 'fedora/29' },
          { text: 'Alpine 3.9', value: 'alpine/3.9' }
        ]
      };
    },
    computed: {
      active: {
        get() {
          return this.$store.state.instances.dialogs.create;
        },
        set(value) {
          if (!value) {
            this.closeDialog();
          }
        }
      },
      items() {
        // console.log(this.$store.getters.instancesTableData);
        // console.log(this.$store.getters['auth/me']);
        return this.$store.getters.instancesTableData;
      },
      me() {
        return this.$store.getters['auth/me'];
      },
      canCreate() {
        return this.me.abilities.includes('instances_create');
      },
      computedHeaders() {
        return this.headers.filter(h =>
          !(h.disk === this.showDisk) &&
          !(h.price === this.showPrice) &&
          !(h.type === this.showType));
      },
      showPrice() {
        return this.$store.getters.appconfig.price.enabled === 'True';
      },
      showDisk() {
        return this.$store.getters.appconfig.storage.enabled === 'True';
      },
      showType() {
        // return this.$store.getters.appconfig.type.enabled === 'True';
        return false;
      }
    },
    watch: {
      dialog(val) {
        return val || this.close();
      }
    },
    methods: {
      filterIpv6(ip) {
        if (ip.scope === 'link') {
          return '';
        }
        return ip.address;
      },
      iconstate(state) {
        switch (state) {
          case 'RUNNING':
            return 'play_arrow';
          case 'STOPPED':
            // code block
            return 'stop';
          default:
            // code block
            return 'pause';
        }
      },
      colorstate(state) {
        switch (state) {
          case 'RUNNING':
            return 'green';
          case 'STOPPED':
            // code block
            return 'red';
          default:
            // code block
            return 'blue';
        }
      },
      setVPS(id) {
        switch (id) {
          case 1:
            this.editedItem.cpu = 1;
            this.editedItem.memory = 512;
            this.editedItem.disk = 10;
            break;
          case 2:
            this.editedItem.cpu = 1;
            this.editedItem.memory = 1024;
            this.editedItem.disk = 30;
            break;
          case 3:
            this.editedItem.cpu = 2;
            this.editedItem.memory = 2048;
            this.editedItem.disk = 50;
            break;
          case 4:
            this.editedItem.cpu = 4;
            this.editedItem.memory = 8172;
            this.editedItem.disk = 160;
            break;
          default:
            this.editedItem.cpu = 1;
            this.editedItem.memory = 512;
            this.editedItem.disk = 10;
        }
      },
      close() {
        this.dialog = false;
        setTimeout(() => {
          this.editedItem = Object.assign({}, this.defaultItem);
          this.editedIndex = -1;
        }, 300);
      },
      save() {
        if (this.editedItem.name) {
          console.log(this.editedItem.memory);
          this.close();
          if (!this.canCreate) {
            console.log('send request');
            this.sendRequest();
          } else {
            this.editedItem.memory = `${this.editedItem.memory}MB`;
            this.editedItem.disk = `${this.editedItem.disk}GB`;
            this.$store.dispatch('createInstance', this.editedItem);
            setTimeout(() => {
              this.$store.dispatch('fetchInstances');
            }, 500);
            console.log('create instance');
          }
        }
      },
      sendRequest() {
        console.log(this.me.name);
        console.log(this.name);
        console.log(this.cpu);
        console.log(this.memory);
        console.log(this.disk);

        if (this.editedItem.name !== '') {
          const data = {
            name: this.editedItem.name,
            os: this.editedItem.os,
            cpu: this.editedItem.cpu,
            memory: `${this.editedItem.memory}MB`,
            disk: `${this.editedItem.disk}GB`
          };
          console.log(data);
          this.$store.dispatch('createRequests', { action: 'create', message: 'Create new instance', status: 'waiting', meta_data: data });
          this.$store.dispatch('notify', { id: 0, message: 'Your request was created', color: '' });
          this.active = false;
        }
      },
      refreshData() {
        this.$store.dispatch('fetchInstances');
      }
    },
    created() {
      if (!this.$store.getters.instancesTableData) {
        this.$store.dispatch('fetchInstances');
        setTimeout(() => {
          this.editedItem = Object.assign({}, this.defaultItem);
          this.editedIndex = -1;
        }, 300);
        console.log('fetched');
      }
      this.$store.dispatch('fetchInstances');
    }
  };
</script>

