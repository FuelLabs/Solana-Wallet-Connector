export const scripts = {
  'verification-script': {
    abi: {
      types: [
        {
          typeId: 0,
          type: '[_; 2]',
          components: [
            {
              name: '__array_element',
              type: 1,
              typeArguments: null,
            },
          ],
          typeParameters: null,
        },
        {
          typeId: 1,
          type: 'b256',
          components: null,
          typeParameters: null,
        },
        {
          typeId: 2,
          type: 'bool',
          components: null,
          typeParameters: null,
        },
        {
          typeId: 3,
          type: 'struct B512',
          components: [
            {
              name: 'bytes',
              type: 0,
              typeArguments: null,
            },
          ],
          typeParameters: null,
        },
        {
          typeId: 4,
          type: 'u64',
          components: null,
          typeParameters: null,
        },
      ],
      functions: [
        {
          inputs: [
            {
              name: 'witness_index',
              type: 4,
              typeArguments: null,
            },
          ],
          name: 'main',
          output: {
            name: '',
            type: 2,
            typeArguments: null,
          },
          attributes: null,
        },
      ],
      loggedTypes: [
        {
          logId: 0,
          loggedType: {
            name: '',
            type: 4,
            typeArguments: null,
          },
        },
        {
          logId: 1,
          loggedType: {
            name: '',
            type: 3,
            typeArguments: [],
          },
        },
        {
          logId: 2,
          loggedType: {
            name: '',
            type: 1,
            typeArguments: null,
          },
        },
        {
          logId: 3,
          loggedType: {
            name: '',
            type: 1,
            typeArguments: null,
          },
        },
        {
          logId: 4,
          loggedType: {
            name: '',
            type: 2,
            typeArguments: null,
          },
        },
      ],
      messagesTypes: [],
      configurables: [
        {
          name: 'SIGNER',
          configurableType: {
            name: '',
            type: 1,
            typeArguments: null,
          },
          offset: 604,
        },
      ],
    },
    bytecode:
      '0x7400000347000000000000000000025c5dfcc00110fff3001aec5000910001c06140000a5d41000033400000614104015047b0e01ae900001ae5100020f8330058fbe00250fbe004740000521a43d0005047b18072480040284504805043b1807244004034001411504bb0a05d43f0081041030072440020284904405d43f00472440020340104915043b1805047b1201ae9100020f8330058fbe00250fbe004740000551a47d0007248004028ed04805043b0605d4bf00810492300724c0020284124c0504bb080724c0020284914c01a47b000404114801a40800013410040764000095043b0505fec000a5045000f5c4bf0285e452000504bb1607244001028490440740000065043b0405fec10085fec0009504bb16072440010284904405043b17072440010284124405043b1401ae9000020f8330058fbe00250fbe0047400002d1a43d0005047b0c072480020284504805d43f00672480020340104525d43b02c134100005c47f028764000011a4400005d43f007334500005d43b02e134100005c47f028764000011a440000244400001af05000910000285ff100005ff110015ff120025ff130035ff3b0041aec5000910000001a43a0001a4790001a4be000724c0040284504c01af51000920000001af9200059f050285d43c0005d47c0015d4bc0025d4fc0035defc004920000284af800001af05000910000285ff100005ff110015ff120025ff130035ff3b0041aec5000910000001a43a0001a47e0001a480000724c0020284124c01af50000920000001af9100059f050285d43c0005d47c0015d4bc0025d4fc0035defc004920000284af8000000000000000000000000000000000000000000000000000000000000000000000000000000000002010000000000000000000000000000030000000000000004000000000000025c',
  },
};
