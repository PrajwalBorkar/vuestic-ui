<template>
  <div class="sticky-table-example">
    <va-data-table
      :items="items"
      footer-clone
      height="180px"
    />

    <va-data-table
      :items="items"
      sticky-header
      footer-clone
      height="180px"
    />

    <va-data-table
      :items="items"
      :style="{
        '--va-data-table-scroll-table-height': '300px',
        '--va-data-table-scroll-table-color': 'orange',
      }"
      sticky-header
      footer-clone
      sticky-footer
    >
      <template #headerAppend>
        <tr>
          <th colspan="1">#</th>
          <th colspan="2">User info</th>
          <th colspan="3">Contact info</th>
        </tr>
      </template>
      <template #footerPrepend>
        <tr>
          <th colspan="6">Additional data in the footer prepend slot</th>
        </tr>
      </template>
    </va-data-table>

    <va-data-table
      :items="items"
      class="my-custom-table-class"
      sticky-header
      footer-clone
      sticky-footer
      selected-color="warning"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  data () {
    const users = [
      {
        id: 1,
        name: 'Leanne Graham',
        username: 'Bret',
        email: 'Sincere@april.biz',
        phone: '1-770-736-8031 x56442',
        website: 'hildegard.org',
      },
      {
        id: 2,
        name: 'Ervin Howell',
        username: 'Antonette',
        email: 'Shanna@melissa.tv',
        phone: '010-692-6593 x09125',
        website: 'anastasia.net',
      },
      {
        id: 3,
        name: 'Clementine Bauch',
        username: 'Samantha',
        email: 'Nathan@yesenia.net',
        phone: '1-463-123-4447',
        website: 'ramiro.info',
      },
      {
        id: 4,
        name: 'Patricia Lebsack',
        username: 'Karianne',
        email: 'Julianne.OConner@kory.org',
        phone: '493-170-9623 x156',
        website: 'kale.biz',
      },
      {
        id: 5,
        name: 'Chelsey Dietrich',
        username: 'Kamren',
        email: 'Lucio_Hettinger@annie.ca',
        phone: '(254)954-1289',
        website: 'demarco.info',
      },
      {
        id: 6,
        name: 'Lindsey Hopkins',
        username: 'Lindsey',
        email: 'lindseyhopkins@nebulean.com',
        phone: '(254)954-1589',
        website: 'nebulean.info',
      },
      {
        id: 7,
        name: 'Head Lloyd',
        username: 'Head',
        email: 'headlloyd@nebulean.com',
        phone: '(254)954-1279',
        website: 'nebulean.info',
      },
      {
        id: 8,
        name: 'Fisher Bradford',
        username: 'Bradford',
        email: 'fisherbradford@nebulean.com',
        phone: '(254)954-5289',
        website: 'nebulean.info',
      },
    ]

    return {
      items: users,
    }
  },
})
</script>

<style lang="scss">
.sticky-table-example {
  .va-data-table {
    border: 1px solid;
  }

  .va-data-table + .va-data-table {
    margin-top: 2rem;
  }

  .my-custom-table-class {
    &.va-data-table--sticky {
      height: 220px;

      .va-data-table__table-thead--sticky {
        background-color: gray;

        .va-data-table__table-th {
          color: white;
        }
      }
    }
  }
}
</style>
